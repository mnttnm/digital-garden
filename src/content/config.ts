import { defineCollection, z } from 'astro:content';

// Schema for notes - unified collection of all content types
const notes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    type: z.enum(['link', 'snippet', 'essay', 'thought']),
    link: z.string().url().optional(),
    linkTitle: z.string().optional(),
    takeaway: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// Schema for TILs (Today I Learned)
const til = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// Schema for projects
const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    featured: z.boolean().default(false),
    github: z.string().url().optional(),
    live: z.string().url().optional(),
    stack: z.array(z.string()).default([]),
    outcome: z.string().optional(),
    tags: z.array(z.string()).default([]),
    activity: z.array(
      z.object({
        date: z.coerce.date(),
        title: z.string(),
        summary: z.string(),
        tags: z.array(z.string()).default([]),
        type: z.enum(['update', 'learning', 'discovery', 'milestone', 'experiment', 'fix']).default('update'),
        highlights: z.array(z.string()).default([]),
        image: z.string().url().optional(),
        imageAlt: z.string().optional(),
        imageCaption: z.string().optional(),
        actionLabel: z.string().optional(),
        actionUrl: z.string().optional(),
        code: z.string().optional(),
        codeLanguage: z.string().optional(),
        links: z.array(
          z.object({
            label: z.string(),
            url: z.string().url(),
          })
        ).default([]),
      })
    ).default([]),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes, projects, til };
