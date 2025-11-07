import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const blogPosts = (await getCollection('blog'))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, 20);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>הבלוג שלי</title>
    <description>בלוג על טכנולוגיה, פיתוח, ופרויקטים</description>
    <link>${site}</link>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>he-IL</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${blogPosts
      .map(
        (post) => `    <item>
      <title>${post.data.title}</title>
      <description>${post.data.description}</description>
      <link>${site}/blog/${post.slug}</link>
      <guid>${site}/blog/${post.slug}</guid>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      ${post.data.tags.map((tag) => `<category>${tag}</category>`).join('\n      ')}
    </item>`
      )
      .join('\n')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};

