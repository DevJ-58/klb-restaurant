import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outputDirectory = path.join(root, 'public');
const outputPath = path.join(outputDirectory, 'og-partage.jpg');
const sourcePath = path.join(root, 'public', 'images', 'hero', 'hero-plat-signature.jpg');
const logoPath = path.join(root, 'public', 'images', 'brand', 'logo-klb-rond.png');
const ink = '#0B0806';
const hasFile = async (filename) => access(filename).then(() => true, () => false);

await mkdir(outputDirectory, { recursive: true });
const hasSource = await hasFile(sourcePath);
const hasLogo = await hasFile(logoPath);
const background = hasSource
  ? await sharp(sourcePath).resize(1200, 630, { fit: 'cover', position: 'centre' }).toBuffer()
  : await sharp({
      create: { width: 1200, height: 630, channels: 3, background: ink },
    }).jpeg().toBuffer();
const layers = [];
if (hasSource) {
  const gradient = Buffer.from(
    '<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#0B0806" stop-opacity=".7"/><stop offset="1" stop-color="#0B0806" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>',
  );
  layers.push({ input: gradient, top: 0, left: 0 });
}
if (hasLogo) {
  const logo = await sharp(logoPath).resize(420, 420, { fit: 'inside' }).png().toBuffer();
  const metadata = await sharp(logo).metadata();
  layers.push({
    input: logo,
    top: Math.round((630 - (metadata.height ?? 420)) / 2),
    left: 80,
  });
}
await sharp(background).composite(layers).jpeg({ quality: 86, mozjpeg: true }).toFile(outputPath);
console.log(`Image de partage générée : ${path.relative(root, outputPath)}.`);
