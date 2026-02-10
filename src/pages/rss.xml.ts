import rss from '@astrojs/rss';
import { getLearningLogItems } from '../lib/learning-log';

export async function GET(context: any) {
  const base = import.meta.env.BASE_URL;
  const items = await getLearningLogItems();
  const rssItems = items.slice(0, 20).map((item) => ({
    title: item.title,
    pubDate: item.date,
    description: item.crux,
    link: item.isExternal
      ? item.href
      : `${base}${item.href.startsWith('/') ? item.href.slice(1) : item.href}`,
  }));

  return rss({
    title: 'learning.log · Mohit Tater',
    description: 'Project updates and discoveries from Mohit.',
    site: context.site,
    items: rssItems,
    customData: `<language>en-us</language>`,
  });
}
