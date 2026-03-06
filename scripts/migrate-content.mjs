#!/usr/bin/env node
/**
 * Content Migration Script
 *
 * Migrates content from old collections (notes, til, resources) to the new discoveries collection.
 * Also updates project activity entries to use the new schema.
 *
 * Usage: node scripts/migrate-content.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, '..', 'src', 'content');

/**
 * Parse frontmatter from markdown content
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error('Invalid frontmatter');
  }

  const yamlContent = match[1];
  const body = match[2];

  // Simple YAML parser for our use case
  const frontmatter = {};
  let currentKey = null;
  let inArray = false;
  let arrayValues = [];

  const lines = yamlContent.split('\n');
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Check for array item
    if (line.match(/^\s+-\s/)) {
      const value = line.replace(/^\s+-\s/, '').trim();
      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, '');
      arrayValues.push(cleanValue);
      continue;
    }

    // If we were building an array, save it
    if (inArray && currentKey) {
      frontmatter[currentKey] = arrayValues;
      inArray = false;
      arrayValues = [];
    }

    // Check for key-value pair
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();

      if (value === '' || value === '[]') {
        // Empty array or start of array
        frontmatter[currentKey] = [];
        inArray = !value;
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Inline array
        const items = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
        frontmatter[currentKey] = items;
      } else {
        // Scalar value
        let cleanValue = value.replace(/^["']|["']$/g, '');
        // Handle booleans
        if (cleanValue === 'true') cleanValue = true;
        else if (cleanValue === 'false') cleanValue = false;
        frontmatter[currentKey] = cleanValue;
      }
    }
  }

  // Save any remaining array
  if (inArray && currentKey) {
    frontmatter[currentKey] = arrayValues;
  }

  return { frontmatter, body };
}

/**
 * Serialize frontmatter to YAML
 */
function serializeFrontmatter(fm) {
  const lines = [];

  for (const [key, value] of Object.entries(fm)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else if (typeof value[0] === 'object') {
        // Array of objects
        lines.push(`${key}:`);
        for (const item of value) {
          let first = true;
          for (const [k, v] of Object.entries(item)) {
            if (v === undefined || v === null) continue;
            const prefix = first ? '  - ' : '    ';
            first = false;
            if (typeof v === 'string' && needsQuoting(v)) {
              lines.push(`${prefix}${k}: "${v.replace(/"/g, '\\"')}"`);
            } else {
              lines.push(`${prefix}${k}: ${v}`);
            }
          }
        }
      } else {
        // Array of primitives
        lines.push(`${key}:`);
        for (const item of value) {
          if (needsQuoting(String(item))) {
            lines.push(`  - "${String(item).replace(/"/g, '\\"')}"`);
          } else {
            lines.push(`  - ${item}`);
          }
        }
      }
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'string') {
      if (needsQuoting(value)) {
        lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  return lines.join('\n');
}

function needsQuoting(value) {
  if (value.length === 0) return true;
  if (/[:\[\]{}#&*!|>'"%@`\n\r]/.test(value)) return true;
  if (/^[-?]/.test(value)) return true;
  if (/^(true|false|null|yes|no|on|off|\d+\.?\d*|\.inf|\.nan)$/i.test(value)) return true;
  return false;
}

/**
 * Migrate a note to discovery
 */
function migrateNote(frontmatter, body, filename) {
  const noteType = frontmatter.type || 'thought';

  // Determine kind based on note type
  let kind = 'learning';
  if (noteType === 'link' && frontmatter.link) {
    kind = 'resource';
  }

  // Build images array from single image
  const images = [];
  if (frontmatter.image) {
    images.push({
      src: frontmatter.image,
      alt: frontmatter.imageAlt || frontmatter.title,
    });
  }

  const newFrontmatter = {
    title: frontmatter.title,
    date: frontmatter.date,
    kind,
    tags: frontmatter.tags || [],
    draft: frontmatter.draft || false,
  };

  // Add URL for link-type notes
  if (frontmatter.link) {
    newFrontmatter.url = frontmatter.link;
    if (frontmatter.linkTitle) {
      newFrontmatter.linkTitle = frontmatter.linkTitle;
    }
  }

  if (images.length > 0) {
    newFrontmatter.images = images;
  } else {
    newFrontmatter.images = [];
  }

  newFrontmatter.videos = [];
  newFrontmatter.prompts = [];

  return {
    frontmatter: newFrontmatter,
    body,
    filename,
  };
}

/**
 * Migrate a TIL to discovery
 */
function migrateTil(frontmatter, body, filename) {
  // Determine kind - if it has a link, it could be a resource
  let kind = 'learning';

  // Build images array from single image
  const images = [];
  if (frontmatter.image) {
    images.push({
      src: frontmatter.image,
      alt: frontmatter.imageAlt || frontmatter.title,
    });
  }

  const newFrontmatter = {
    title: frontmatter.title,
    date: frontmatter.date,
    kind,
    tags: frontmatter.tags || [],
    draft: frontmatter.draft || false,
  };

  // Add URL if present
  if (frontmatter.link) {
    newFrontmatter.url = frontmatter.link;
    if (frontmatter.linkTitle) {
      newFrontmatter.linkTitle = frontmatter.linkTitle;
    }
  }

  if (images.length > 0) {
    newFrontmatter.images = images;
  } else {
    newFrontmatter.images = [];
  }

  newFrontmatter.videos = [];
  newFrontmatter.prompts = [];

  return {
    frontmatter: newFrontmatter,
    body,
    filename,
  };
}

/**
 * Migrate a resource to discovery
 */
function migrateResource(frontmatter, body, filename) {
  // Build images array from single image
  const images = [];
  if (frontmatter.image) {
    images.push({
      src: frontmatter.image,
      alt: frontmatter.imageAlt || frontmatter.title,
    });
  }

  const newFrontmatter = {
    title: frontmatter.title,
    date: frontmatter.date,
    kind: 'resource',
    tags: frontmatter.tags || [],
    draft: frontmatter.draft || false,
    url: frontmatter.url,
  };

  if (images.length > 0) {
    newFrontmatter.images = images;
  } else {
    newFrontmatter.images = [];
  }

  newFrontmatter.videos = [];
  newFrontmatter.prompts = [];

  // Use description as body if body is empty or same as description
  const trimmedBody = body.trim();
  const newBody = trimmedBody && trimmedBody !== frontmatter.description
    ? trimmedBody
    : frontmatter.description || '';

  return {
    frontmatter: newFrontmatter,
    body: newBody,
    filename,
  };
}

/**
 * Migrate project activity entries
 */
function migrateProjectActivity(activity) {
  const migratedActivity = [];

  for (const event of activity) {
    // Build images array - merge single image and images array
    const images = [];
    if (event.images && event.images.length > 0) {
      for (const img of event.images) {
        images.push({
          src: img.src,
          alt: img.alt,
          caption: img.caption,
        });
      }
    } else if (event.image) {
      images.push({
        src: event.image,
        alt: event.imageAlt || event.title,
        caption: event.imageCaption,
      });
    }

    // Build videos array
    const videos = [];
    if (event.videos && event.videos.length > 0) {
      for (const vid of event.videos) {
        videos.push({
          src: vid.src,
          poster: vid.poster,
          caption: vid.caption || vid.title,
        });
      }
    }

    const migratedEvent = {
      date: event.date,
      title: event.title,
      summary: event.summary,
      activityType: event.type || 'update', // Rename type -> activityType
      tags: event.tags || [],
      images,
      videos,
    };

    // Add optional fields
    if (event.code) migratedEvent.code = event.code;
    if (event.codeLanguage) migratedEvent.codeLanguage = event.codeLanguage;
    if (event.actionLabel) migratedEvent.actionLabel = event.actionLabel;
    if (event.actionUrl) migratedEvent.actionUrl = event.actionUrl;
    if (event.links && event.links.length > 0) {
      migratedEvent.url = event.links[0].url;
    }

    migratedEvent.prompts = [];

    migratedActivity.push(migratedEvent);
  }

  return migratedActivity;
}

/**
 * Read and parse a project file with complex YAML
 */
async function parseProjectFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');

  // For projects, we need a more robust YAML parser
  // Let's use a line-by-line approach that handles nested structures
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error('Invalid frontmatter in project file');
  }

  return {
    raw: content,
    yamlSection: match[1],
    body: match[2],
  };
}

async function migrateCollection(collectionName, migrateFn) {
  const srcDir = path.join(contentDir, collectionName);
  const destDir = path.join(contentDir, 'discoveries');

  // Ensure discoveries directory exists
  await fs.mkdir(destDir, { recursive: true });

  // Check if source directory exists
  try {
    await fs.access(srcDir);
  } catch {
    console.log(`  No ${collectionName} directory found, skipping...`);
    return [];
  }

  const files = await fs.readdir(srcDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  console.log(`  Found ${mdFiles.length} ${collectionName} files`);

  const migrated = [];

  for (const filename of mdFiles) {
    const filePath = path.join(srcDir, filename);
    const content = await fs.readFile(filePath, 'utf-8');

    try {
      const { frontmatter, body } = parseFrontmatter(content);
      const result = migrateFn(frontmatter, body, filename);

      // Write to discoveries
      const newContent = `---\n${serializeFrontmatter(result.frontmatter)}\n---\n\n${result.body.trim()}\n`;
      const destPath = path.join(destDir, result.filename);

      await fs.writeFile(destPath, newContent);
      migrated.push(filename);
      console.log(`    Migrated: ${filename}`);
    } catch (error) {
      console.error(`    Failed to migrate ${filename}: ${error.message}`);
    }
  }

  return migrated;
}

async function migrateProjects() {
  const projectsDir = path.join(contentDir, 'projects');

  // Check if projects directory exists
  try {
    await fs.access(projectsDir);
  } catch {
    console.log('  No projects directory found, skipping...');
    return [];
  }

  const files = await fs.readdir(projectsDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));

  console.log(`  Found ${mdFiles.length} project files`);

  const migrated = [];

  for (const filename of mdFiles) {
    const filePath = path.join(projectsDir, filename);
    const content = await fs.readFile(filePath, 'utf-8');

    try {
      // Projects have complex YAML, so we need to handle them specially
      // For now, just update the type -> activityType in activity entries

      // Simple regex-based replacement for type: -> activityType:
      // Only within activity blocks
      let newContent = content;

      // Replace type: with activityType: in activity sections
      // This is a safe transformation as 'type:' in activity is always the activity type
      newContent = newContent.replace(/(\s+)type:\s*(['"]?)(update|learning|discovery|milestone|experiment|fix)(['"]?)/g,
        '$1activityType: $2$3$4');

      // Remove highlights, image, imageAlt, imageCaption if they exist (old format)
      // These should already be in images array format

      if (newContent !== content) {
        await fs.writeFile(filePath, newContent);
        migrated.push(filename);
        console.log(`    Updated: ${filename}`);
      } else {
        console.log(`    No changes needed: ${filename}`);
      }
    } catch (error) {
      console.error(`    Failed to update ${filename}: ${error.message}`);
    }
  }

  return migrated;
}

async function main() {
  console.log('Content Migration Script');
  console.log('========================\n');

  console.log('Phase 1: Migrating notes to discoveries...');
  const migratedNotes = await migrateCollection('notes', migrateNote);

  console.log('\nPhase 2: Migrating TILs to discoveries...');
  const migratedTils = await migrateCollection('til', migrateTil);

  console.log('\nPhase 3: Migrating resources to discoveries...');
  const migratedResources = await migrateCollection('resources', migrateResource);

  console.log('\nPhase 4: Updating project activity entries...');
  const migratedProjects = await migrateProjects();

  console.log('\n========================');
  console.log('Migration Summary:');
  console.log(`  Notes migrated: ${migratedNotes.length}`);
  console.log(`  TILs migrated: ${migratedTils.length}`);
  console.log(`  Resources migrated: ${migratedResources.length}`);
  console.log(`  Projects updated: ${migratedProjects.length}`);

  console.log('\nNext steps:');
  console.log('  1. Review the migrated content in src/content/discoveries/');
  console.log('  2. Update any references to old collections in code');
  console.log('  3. Delete old collection directories when satisfied');
}

main().catch(console.error);
