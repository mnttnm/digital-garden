import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context: any) {
  // Get all content
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  const projects = await getCollection('projects', ({ data }) => !data.draft);

  // Combine and sort all content
  const allItems = [
    ...notes.map(note => ({
      title: note.data.title,
      pubDate: note.data.date,
      description: note.data.takeaway || note.data.title,
      link: note.data.type === 'link' && note.data.link
        ? note.data.link
        : `/digital-garden/notes/${note.slug}/`,
    })),
    ...projects.map(project => ({
      title: `Project: ${project.data.title}`,
      pubDate: project.data.date,
      description: project.data.description,
      link: `/digital-garden/projects/${project.slug}/`,
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: 'Mohit Tater',
    description: 'Notes, learnings, and projects',
    site: context.site,
    items: allItems.slice(0, 20),
    customData: `<language>en-us</language>`,
  });
}
