import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outputDirectory = path.join(root, 'public', 'icons');
const monogramPath = path.join(root, 'public', 'images', 'brand', 'logo-klb-monogramme.png');
const roundLogoPath = path.join(root, 'public', 'images', 'brand', 'logo-klb-rond.png');
const hasFile = async (filename) => access(filename).then(() => true, () => false);
const logoPath = (await hasFile(monogramPath)) ? monogramPath : roundLogoPath;
await mkdir(outputDirectory, { recursive: true });

async function createIcon(size, filename) {
  const logo = await sharp(logoPath)
    .resize(Math.round(size * 0.64), Math.round(size * 0.64), { fit: 'contain' })
    .png()
    .toBuffer();
  const radius = Math.round(size * 0.18);
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${radius}" fill="#0B0806"/></svg>`,
  );
  await sharp(mask)
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(outputDirectory, filename));
}

await Promise.all([
  createIcon(32, 'favicon-32.png'),
  createIcon(180, 'apple-touch-icon.png'),
  createIcon(192, 'icon-192.png'),
  createIcon(512, 'icon-512.png'),
]);
await writeFile(
  path.join(root, 'public', 'manifest.webmanifest'),
  `${JSON.stringify({
    name: 'KLB Restaurant',
    short_name: 'KLB',
    lang: 'fr',
    display: 'standalone',
    start_url: '/',
    theme_color: '#0B0806',
    background_color: '#0B0806',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }, null, 2)}\n`,
);
console.log('Icônes et manifeste PWA générés.');
