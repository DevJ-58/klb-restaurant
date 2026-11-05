import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from 'vite';

const root = process.cwd();
const env = { ...loadEnv('production', root, 'VITE_'), ...process.env };
const configuredUrl = env.VITE_SITE_URL?.trim().replace(/\/+$/, '') ?? '';
const routes = ['/', '/carte', '/ambiance', '/nous-trouver'];
const lastmod = new Date().toISOString().slice(0, 10);
const locations = routes
  .map((route) => {
    const loc = configuredUrl ? `${configuredUrl}${route}` : route;
    return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
  })
  .join('\n');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations}\n</urlset>\n`;
const sitemapLocation = configuredUrl ? `${configuredUrl}/sitemap.xml` : '/sitemap.xml';
const robots = `User-agent: *\nAllow: /\nSitemap: ${sitemapLocation}\n`;
await writeFile(path.join(root, 'public', 'sitemap.xml'), sitemap, 'utf8');
await writeFile(path.join(root, 'public', 'robots.txt'), robots, 'utf8');
if (!configuredUrl) {
  console.warn('VITE_SITE_URL est vide : sitemap.xml et robots.txt utilisent des chemins relatifs.');
}
