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
    takeaway: z.string().optional(),
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
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes, projects };
