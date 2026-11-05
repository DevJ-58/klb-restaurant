import { readdir, readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, 'public', 'images');
const outputRoot = path.join(projectRoot, 'public', 'images-opt');
const manifestPath = path.join(projectRoot, 'src', 'data', 'image-manifest.json');
const widths = [480, 800, 1200, 1600, 2400];
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png']);

async function findImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return findImages(fullPath);
      return supportedExtensions.has(path.extname(entry.name).toLowerCase()) ? [fullPath] : [];
    }),
  );
  return nested.flat();
}

async function ensureVariant(source, destination, sourceStat, width, format) {
  try {
    const outputStat = await stat(destination);
    if (outputStat.mtimeMs >= sourceStat.mtimeMs) return;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  await mkdir(path.dirname(destination), { recursive: true });
  const pipeline = sharp(source).resize({ width, withoutEnlargement: true });
  if (format === 'avif') {
    await pipeline.avif({ quality: 50 }).toFile(destination);
  } else {
    await pipeline.webp({ quality: 72 }).toFile(destination);
  }
}

const entries = {};
const images = (await findImages(sourceRoot)).sort();
for (const source of images) {
  const relativePath = path.relative(sourceRoot, source);
  const sourceStat = await stat(source);
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Impossible de lire les dimensions de ${source}.`);
  }

  const relativeDirectory = path.dirname(relativePath);
  const basename = path.basename(relativePath, path.extname(relativePath));
  const variants = { avif: [], webp: [] };
  for (const width of widths.filter((candidate) => candidate <= metadata.width)) {
    for (const format of ['avif', 'webp']) {
      const filename = `${basename}-${width}.${format}`;
      const output = path.join(outputRoot, relativeDirectory, filename);
      await ensureVariant(source, output, sourceStat, width, format);
      const publicPath = `/images-opt/${relativeDirectory === '.' ? '' : `${relativeDirectory}/`}${filename}`;
      variants[format].push({ src: publicPath, width });
    }
  }
  entries[`/images/${relativePath.replaceAll(path.sep, '/')}`] = {
    width: metadata.width,
    height: metadata.height,
    ...variants,
  };
}

const serialized = `${JSON.stringify(entries, null, 2)}\n`;
let existing = '';
try {
  existing = await readFile(manifestPath, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
if (existing !== serialized) {
  await writeFile(manifestPath, serialized, 'utf8');
}
console.log(`Variantes d’images prêtes : ${images.length} originaux, manifeste ${path.relative(projectRoot, manifestPath)}.`);
