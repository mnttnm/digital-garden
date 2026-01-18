import { defineCollection, z } from 'astro:content';

// Schema for blog posts (long-form articles)
const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
  }),
});

// Schema for TIL (Today I Learned) - quick notes
const til = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// Schema for curated resources
const resources = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum(['article', 'video', 'tool', 'book', 'course', 'other']),
    url: z.string().url(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// Schema for project updates
const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    status: z.enum(['idea', 'in-progress', 'completed', 'archived']).default('in-progress'),
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, til, resources, projects };
