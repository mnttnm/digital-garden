/**
 * GitHub Publishing
 *
 * Commits approved captures to the repository using GitHub API.
 * Triggers automatic Vercel deployment on push.
 */

import type { Capture, ProjectActivityEntry, ProjectActivityTransformResult, TransformResult } from './types';
import { transformCapture, getContentPath, isProjectUpdate, formatDate, slugify } from './transform';

interface GitHubConfig {
  token: string;
  repo: string;
  branch?: string;
}

interface CreateFileResponse {
  content: {
    sha: string;
    path: string;
    html_url: string;
  };
  commit: {
    sha: string;
    message: string;
  };
}

/**
 * Get GitHub configuration from environment
 */
function getGitHubConfig(): GitHubConfig {
  const token = import.meta.env.GITHUB_TOKEN;
  const repo = import.meta.env.GITHUB_REPO;

  if (!token || !repo) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO environment variables');
  }

  return {
    token,
    repo,
    branch: 'main',
  };
}

/**
 * Check if GitHub publishing is configured
 */
export function isGitHubConfigured(): boolean {
  return Boolean(import.meta.env.GITHUB_TOKEN && import.meta.env.GITHUB_REPO);
}

/**
 * Create or update a file in the repository
 */
async function createFile(
  config: GitHubConfig,
  path: string,
  content: string,
  message: string
): Promise<CreateFileResponse> {
  const url = `https://api.github.com/repos/${config.repo}/contents/${path}`;

  // Check if file already exists (for update)
  let existingSha: string | undefined;
  try {
    const checkResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (checkResponse.ok) {
      const existing = await checkResponse.json();
      existingSha = existing.sha;
    }
  } catch {
    // File doesn't exist, that's fine
  }

  // Create/update the file
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch: config.branch || 'main',
  };

  if (existingSha) {
    body.sha = existingSha;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Get file content from the repository
 */
async function getFileContent(
  config: GitHubConfig,
  path: string
): Promise<{ content: string; sha: string } | null> {
  const url = `https://api.github.com/repos/${config.repo}/contents/${path}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const data = await response.json();
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return { content, sha: data.sha };
}

/**
 * Serialize a project activity entry to YAML
 */
function serializeActivity(activity: ProjectActivityEntry): string {
  const lines: string[] = [];
  lines.push(`  - date: ${activity.date}`);
  lines.push(`    title: "${activity.title.replace(/"/g, '\\"')}"`);
  lines.push(`    summary: "${activity.summary.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`);

  if (activity.tags.length > 0) {
    lines.push(`    tags:`);
    activity.tags.forEach(tag => lines.push(`      - "${tag}"`));
  } else {
    lines.push(`    tags: []`);
  }

  lines.push(`    type: "${activity.type}"`);

  if (activity.highlights && activity.highlights.length > 0) {
    lines.push(`    highlights:`);
    activity.highlights.forEach(h => lines.push(`      - "${h.replace(/"/g, '\\"')}"`));
  }

  if (activity.image) {
    lines.push(`    image: "${activity.image}"`);
  }
  if (activity.imageAlt) {
    lines.push(`    imageAlt: "${activity.imageAlt.replace(/"/g, '\\"')}"`);
  }
  if (activity.imageCaption) {
    lines.push(`    imageCaption: "${activity.imageCaption.replace(/"/g, '\\"')}"`);
  }
  if (activity.actionLabel) {
    lines.push(`    actionLabel: "${activity.actionLabel}"`);
  }
  if (activity.actionUrl) {
    lines.push(`    actionUrl: "${activity.actionUrl}"`);
  }
  if (activity.code) {
    lines.push(`    code: |`);
    activity.code.split('\n').forEach(line => lines.push(`      ${line}`));
  }
  if (activity.codeLanguage) {
    lines.push(`    codeLanguage: "${activity.codeLanguage}"`);
  }
  if (activity.links && activity.links.length > 0) {
    lines.push(`    links:`);
    activity.links.forEach(link => {
      lines.push(`      - label: "${link.label}"`);
      lines.push(`        url: "${link.url}"`);
    });
  }

  return lines.join('\n');
}

/**
 * Insert a new activity entry into a project file
 * Prepends the new activity to the existing activity array
 */
function insertActivityIntoProject(
  projectContent: string,
  activity: ProjectActivityEntry
): string {
  const activityYaml = serializeActivity(activity);

  // Find the activity: line and insert after it
  const activityMatch = projectContent.match(/^activity:\s*$/m);

  if (activityMatch && activityMatch.index !== undefined) {
    // Insert new activity right after "activity:"
    const insertPos = activityMatch.index + activityMatch[0].length;
    return (
      projectContent.slice(0, insertPos) +
      '\n' + activityYaml +
      projectContent.slice(insertPos)
    );
  }

  // If no activity array exists, add it before draft: false or before ---
  const draftMatch = projectContent.match(/^draft:\s*(true|false)\s*$/m);
  if (draftMatch && draftMatch.index !== undefined) {
    return (
      projectContent.slice(0, draftMatch.index) +
      'activity:\n' + activityYaml + '\n' +
      projectContent.slice(draftMatch.index)
    );
  }

  // Fallback: insert before the closing ---
  const closingFrontmatter = projectContent.lastIndexOf('---');
  if (closingFrontmatter > 3) {
    return (
      projectContent.slice(0, closingFrontmatter) +
      'activity:\n' + activityYaml + '\n' +
      projectContent.slice(closingFrontmatter)
    );
  }

  return projectContent;
}

/**
 * Save an image to the repository
 * @returns The URL path to the saved image
 */
async function saveImage(
  config: GitHubConfig,
  imageData: string,
  captureId: string
): Promise<string> {
  const date = new Date().toISOString().split('T')[0];
  const idPrefix = captureId.slice(0, 8);
  const filename = `${date}-${idPrefix}.png`;
  const path = `public/captures/${filename}`;

  // Remove data URL prefix if present
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

  const url = `https://api.github.com/repos/${config.repo}/contents/${path}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `content: add captured image ${filename}`,
      content: base64Data,
      branch: config.branch || 'main',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to save image: ${response.status} ${error}`);
  }

  return `/captures/${filename}`;
}

/**
 * Publish a project activity capture
 */
async function publishProjectActivity(
  capture: Capture,
  result: ProjectActivityTransformResult,
  config: GitHubConfig
): Promise<{ sha: string; url: string; path: string; slug: string }> {
  const projectPath = `src/content/projects/${result.projectSlug}.md`;

  // Get existing project file
  const existing = await getFileContent(config, projectPath);
  if (!existing) {
    throw new Error(`Project file not found: ${projectPath}`);
  }

  // Save image if present
  let imageUrl: string | undefined;
  if (result.imageData) {
    imageUrl = await saveImage(config, result.imageData, capture.id);
    result.activity.image = imageUrl;
  }

  // Insert new activity
  const updatedContent = insertActivityIntoProject(existing.content, result.activity);

  // Commit updated project file
  const message = `content: add activity "${result.activity.title}" to ${result.projectSlug}`;

  const url = `https://api.github.com/repos/${config.repo}/contents/${projectPath}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(updatedContent).toString('base64'),
      sha: existing.sha,
      branch: config.branch || 'main',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }

  const responseData = await response.json();

  // Generate anchor slug for the activity
  const activitySlug = `${result.activity.date}-${slugify(result.activity.title)}`;

  return {
    sha: responseData.commit.sha,
    url: responseData.content.html_url,
    path: projectPath,
    slug: activitySlug,
  };
}

/**
 * Publish an approved capture to the repository
 *
 * @param capture The capture to publish
 * @param useRefined Whether to use AI-refined content
 * @returns The commit SHA and file URL
 */
export async function publishCapture(
  capture: Capture,
  useRefined = true
): Promise<{ sha: string; url: string; path: string; slug?: string; collection?: string }> {
  const config = getGitHubConfig();

  // Transform capture
  const result = transformCapture(capture, useRefined);

  // Handle project activity updates
  if (result.collection === 'project-update') {
    const projectResult = result as ProjectActivityTransformResult;
    const published = await publishProjectActivity(capture, projectResult, config);
    return {
      ...published,
      collection: 'project-update',
    };
  }

  // Handle notes/TIL
  const contentResult = result as TransformResult;
  const path = getContentPath(contentResult);

  // Save image if present (for notes, add inline markdown)
  let body = contentResult.body;
  if (capture.images?.[0]?.data) {
    const imageUrl = await saveImage(config, capture.images[0].data, capture.id);
    body = `![Captured image](${imageUrl})\n\n${body}`;
  }

  // Generate commit message
  const collection = contentResult.collection === 'til' ? 'TIL' : 'note';
  const title = contentResult.frontmatter.title;
  const message = `content: add ${collection} "${title}"`;

  // Rebuild full content with image if added
  const fullContent = body !== contentResult.body
    ? contentResult.fullContent.replace(contentResult.body, body)
    : contentResult.fullContent;

  // Commit to GitHub
  const response = await createFile(config, path, fullContent, message);

  return {
    sha: response.commit.sha,
    url: response.content.html_url,
    path: response.content.path,
    slug: contentResult.filename.replace(/\.md$/, ''),
    collection: contentResult.collection,
  };
}

/**
 * Preview what would be published without actually committing
 */
export function previewPublish(capture: Capture, useRefined = true): {
  path: string;
  content: string;
  message: string;
  isProjectUpdate: boolean;
  projectSlug?: string;
} {
  const result = transformCapture(capture, useRefined);

  // Handle project activity updates
  if (result.collection === 'project-update') {
    const projectResult = result as ProjectActivityTransformResult;
    const activityYaml = serializeActivity(projectResult.activity);
    return {
      path: `src/content/projects/${projectResult.projectSlug}.md`,
      content: `# Activity Entry Preview\n\n\`\`\`yaml\n${activityYaml}\n\`\`\``,
      message: `content: add activity "${projectResult.activity.title}" to ${projectResult.projectSlug}`,
      isProjectUpdate: true,
      projectSlug: projectResult.projectSlug,
    };
  }

  // Handle notes/TIL
  const contentResult = result as TransformResult;
  const path = getContentPath(contentResult);
  const collection = contentResult.collection === 'til' ? 'TIL' : 'note';
  const title = contentResult.frontmatter.title;
  const message = `content: add ${collection} "${title}"`;

  return {
    path,
    content: contentResult.fullContent,
    message,
    isProjectUpdate: false,
  };
}

interface FileEntry {
  id: string;
  path: string;
  content: string;
  title: string;
  slug: string;
  collection: string;
  isProjectUpdate: boolean;
  projectSlug?: string;
  imageData?: string;
}

/**
 * Batch publish multiple captures in a single commit
 * This triggers only ONE Vercel deployment regardless of item count
 */
export async function batchPublishCaptures(
  captures: Capture[],
  useRefined = true
): Promise<{ sha: string; filesAdded: number; ids: string[]; publishedInfo: Array<{ id: string; slug: string; collection: string }> }> {
  if (captures.length === 0) {
    throw new Error('No captures to publish');
  }

  const config = getGitHubConfig();
  const branch = config.branch || 'main';

  // Separate project updates from regular captures
  const regularCaptures = captures.filter(c => !isProjectUpdate(c));
  const projectUpdates = captures.filter(c => isProjectUpdate(c));

  // For project updates, we need to fetch existing project files and merge activities
  // Group by project slug to handle multiple updates to same project
  const projectUpdatesBySlug = new Map<string, { capture: Capture; result: ProjectActivityTransformResult }[]>();

  for (const capture of projectUpdates) {
    // Use capture's stored preference, fallback to global useRefined
    const captureUseRefined = capture.publishUseRefined ?? useRefined;
    const result = transformCapture(capture, captureUseRefined) as ProjectActivityTransformResult;
    const existing = projectUpdatesBySlug.get(result.projectSlug) || [];
    existing.push({ capture, result });
    projectUpdatesBySlug.set(result.projectSlug, existing);
  }

  // Process regular captures
  const files: FileEntry[] = regularCaptures.map((capture) => {
    // Use capture's stored preference, fallback to global useRefined
    const captureUseRefined = capture.publishUseRefined ?? useRefined;
    const result = transformCapture(capture, captureUseRefined) as TransformResult;
    const path = getContentPath(result);
    const slug = result.filename.replace(/\.md$/, '');

    // Handle inline image for notes
    let body = result.body;
    const imageData = capture.images?.[0]?.data;
    if (imageData) {
      // We'll add the image URL after we save it
      // For now, mark that we need to handle this
    }

    return {
      id: capture.id,
      path,
      content: result.fullContent,
      title: result.frontmatter.title,
      slug,
      collection: result.collection,
      isProjectUpdate: false,
      imageData: capture.images?.[0]?.data,
    };
  });

  // Process project updates - fetch existing files and merge
  for (const [projectSlug, updates] of projectUpdatesBySlug) {
    const projectPath = `src/content/projects/${projectSlug}.md`;
    const existing = await getFileContent(config, projectPath);

    if (!existing) {
      console.warn(`Project file not found: ${projectPath}, skipping updates`);
      continue;
    }

    // Apply all activity updates to this project (newest first)
    let updatedContent = existing.content;
    const titles: string[] = [];

    // Sort updates by date descending so newest appears first
    const sortedUpdates = updates.sort((a, b) =>
      new Date(b.result.activity.date).getTime() - new Date(a.result.activity.date).getTime()
    );

    for (const { capture, result } of sortedUpdates) {
      // Handle image for project activity
      if (result.imageData) {
        const imageUrl = await saveImage(config, result.imageData, capture.id);
        result.activity.image = imageUrl;
      }

      updatedContent = insertActivityIntoProject(updatedContent, result.activity);
      titles.push(result.activity.title);
    }

    // Add each update as a publishedInfo entry
    for (const { capture, result } of sortedUpdates) {
      const activitySlug = `${result.activity.date}-${slugify(result.activity.title)}`;
      files.push({
        id: capture.id,
        path: projectPath,
        content: updatedContent,
        title: result.activity.title,
        slug: activitySlug,
        collection: 'project-update',
        isProjectUpdate: true,
        projectSlug,
      });
    }
  }

  if (files.length === 0) {
    throw new Error('No files to publish after processing');
  }

  // Deduplicate files by path (project updates to same file will have been merged)
  const uniqueFiles = new Map<string, FileEntry>();
  for (const file of files) {
    uniqueFiles.set(file.path, file);
  }
  const filesToCommit = Array.from(uniqueFiles.values());

  // Handle images for regular captures
  for (const file of filesToCommit) {
    if (!file.isProjectUpdate && file.imageData) {
      const imageUrl = await saveImage(config, file.imageData, file.id);
      // Insert image at start of body
      file.content = file.content.replace(
        /^(---[\s\S]*?---\n\n)/,
        `$1![Captured image](${imageUrl})\n\n`
      );
    }
  }

  // Get the current commit SHA for the branch
  const refResponse = await fetch(
    `https://api.github.com/repos/${config.repo}/git/ref/heads/${branch}`,
    {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!refResponse.ok) {
    throw new Error(`Failed to get branch ref: ${refResponse.status}`);
  }

  const refData = await refResponse.json();
  const currentCommitSha = refData.object.sha;

  // Get the current commit's tree
  const commitResponse = await fetch(
    `https://api.github.com/repos/${config.repo}/git/commits/${currentCommitSha}`,
    {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!commitResponse.ok) {
    throw new Error(`Failed to get commit: ${commitResponse.status}`);
  }

  const commitData = await commitResponse.json();
  const baseTreeSha = commitData.tree.sha;

  // Create blobs for each file
  const treeEntries = await Promise.all(
    filesToCommit.map(async (file) => {
      const blobResponse = await fetch(
        `https://api.github.com/repos/${config.repo}/git/blobs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: file.content,
            encoding: 'utf-8',
          }),
        }
      );

      if (!blobResponse.ok) {
        throw new Error(`Failed to create blob for ${file.path}`);
      }

      const blobData = await blobResponse.json();
      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blobData.sha,
      };
    })
  );

  // Create a new tree with the new files
  const treeResponse = await fetch(
    `https://api.github.com/repos/${config.repo}/git/trees`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeEntries,
      }),
    }
  );

  if (!treeResponse.ok) {
    throw new Error(`Failed to create tree: ${treeResponse.status}`);
  }

  const treeData = await treeResponse.json();

  // Create commit message
  const itemCount = captures.length;
  const titles = files.slice(0, 3).map((f) => f.title);
  const message =
    itemCount === 1
      ? `content: add "${titles[0]}"`
      : `content: add ${itemCount} items\n\n${titles.map((t) => `- ${t}`).join('\n')}${itemCount > 3 ? `\n- ... and ${itemCount - 3} more` : ''}`;

  // Create the commit
  const newCommitResponse = await fetch(
    `https://api.github.com/repos/${config.repo}/git/commits`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: [currentCommitSha],
      }),
    }
  );

  if (!newCommitResponse.ok) {
    throw new Error(`Failed to create commit: ${newCommitResponse.status}`);
  }

  const newCommitData = await newCommitResponse.json();

  // Update the branch reference
  const updateRefResponse = await fetch(
    `https://api.github.com/repos/${config.repo}/git/refs/heads/${branch}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: newCommitData.sha,
      }),
    }
  );

  if (!updateRefResponse.ok) {
    throw new Error(`Failed to update ref: ${updateRefResponse.status}`);
  }

  return {
    sha: newCommitData.sha,
    filesAdded: filesToCommit.length,
    ids: files.map((f) => f.id),
    publishedInfo: files.map((f) => ({
      id: f.id,
      slug: f.slug,
      collection: f.collection,
    })),
  };
}
