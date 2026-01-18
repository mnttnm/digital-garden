import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context: any) {
  // Get all content
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const til = await getCollection('til', ({ data }) => !data.draft);
  const projects = await getCollection('projects', ({ data }) => !data.draft);

  // Combine and sort all content
  const allItems = [
    ...posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/digital-garden/posts/${post.slug}/`,
    })),
    ...til.map(item => ({
      title: `TIL: ${item.data.title}`,
      pubDate: item.data.date,
      description: item.data.title,
      link: `/digital-garden/til/${item.slug}/`,
    })),
    ...projects.map(project => ({
      title: `Project: ${project.data.title}`,
      pubDate: project.data.date,
      description: project.data.description,
      link: `/digital-garden/projects/${project.slug}/`,
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: 'Digital Garden',
    description: 'Personal notes, learnings, and curated resources',
    site: context.site,
    items: allItems.slice(0, 20), // Latest 20 items
    customData: `<language>en-us</language>`,
  });
}
