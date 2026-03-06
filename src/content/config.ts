import { defineCollection, z } from 'astro:content';

// Schema for discoveries (replaces notes, til, resources)
const discoveries = defineCollection({
  type: 'content',
  schema: z.object({
    // Core fields
    title: z.string(),
    date: z.coerce.date(),
    kind: z.enum(['learning', 'resource']),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),

    // Link (optional - present for resources and link-based learnings)
    url: z.string().url().optional(),
    linkTitle: z.string().optional(), // Actual page title (for link widget display)

    // Media (all use arrays for consistency)
    images: z.array(z.object({
      src: z.string(),
      alt: z.string().optional(),
      caption: z.string().optional(),
    })).default([]),
    videos: z.array(z.object({
      src: z.string(),
      poster: z.string().optional(),
      caption: z.string().optional(),
    })).default([]),
    code: z.string().optional(),
    codeLanguage: z.string().optional(),

    // Prompts used to create/refine this content
    prompts: z.array(z.string()).default([]),
  }),
});

// Schema for projects
const projects = defineCollection({
  type: 'content',
  schema: z.object({
    // Core fields
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),

    // Project-specific
    github: z.string().url().optional(),
    live: z.string().url().optional(),
    stack: z.array(z.string()).default([]),

    // Legacy fields (kept for backward compatibility)
    featured: z.boolean().default(false),
    outcome: z.string().optional(),
    image: z.string().optional(),

    // Activity log (same media schema as discoveries)
    activity: z.array(z.object({
      date: z.coerce.date(),
      title: z.string(),
      summary: z.string(),
      activityType: z.enum([
        'update',
        'milestone',
        'fix',
        'learning',
        'discovery',
        'experiment'
      ]).default('update'),
      tags: z.array(z.string()).default([]),

      // Media (same structure as discoveries)
      images: z.array(z.object({
        src: z.string(),
        alt: z.string().optional(),
        caption: z.string().optional(),
      })).default([]),
      videos: z.array(z.object({
        src: z.string(),
        poster: z.string().optional(),
        caption: z.string().optional(),
        title: z.string().optional(), // Legacy field
      })).default([]),
      code: z.string().optional(),
      codeLanguage: z.string().optional(),

      // Links
      url: z.string().url().optional(),
      actionLabel: z.string().optional(),
      actionUrl: z.string().url().optional(),
      links: z.array(z.object({
        label: z.string(),
        url: z.string().url(),
      })).default([]),

      // Legacy fields (kept for backward compatibility)
      highlights: z.array(z.string()).default([]),
      image: z.string().optional(),
      imageAlt: z.string().optional(),
      imageCaption: z.string().optional(),

      // Prompts
      prompts: z.array(z.string()).default([]),
    })).default([]),
  }),
});

export const collections = { discoveries, projects };
