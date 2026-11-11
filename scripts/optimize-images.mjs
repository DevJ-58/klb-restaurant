import { readdir, readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const sourceRoot = path.join(projectRoot, 'public', 'images');
const outputRoot = path.join(projectRoot, 'public', 'images-opt');
const manifestPath = path.join(projectRoot, 'src', 'data', 'image-manifest.json');
const widths = [320, 480, 640, 800, 1200, 1600, 2400];
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png']);
const heroBackgroundCandidates = [
  path.join(sourceRoot, 'hero', 'hero-fond-salle.jpg'),
  path.join(sourceRoot, 'hero', 'hero-plat-signature.jpg'),
];
const heroDetailPhotos = new Set([
  path.join(sourceRoot, 'ambiance-salle-01.jpg'),
  path.join(sourceRoot, 'equipe', 'cuisine-flamme.jpg'),
  path.join(sourceRoot, 'ambiance-comptoir.jpg'),
]);

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
  const isMenuPhoto = path.relative(sourceRoot, source).split(path.sep)[0] === 'plats';
  const isHeroDetailPhoto = heroDetailPhotos.has(source);
  const maxBytes =
    isHeroDetailPhoto && format === 'webp' && width === 640
      ? 90 * 1024
      : isMenuPhoto && format === 'webp' && width === 320
      ? 40 * 1024
      : isMenuPhoto && format === 'webp' && width === 640
        ? 90 * 1024
        : undefined;
  try {
    const outputStat = await stat(destination);
    if (
      outputStat.mtimeMs >= sourceStat.mtimeMs &&
      (maxBytes === undefined || outputStat.size <= maxBytes)
    ) {
      return;
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  await mkdir(path.dirname(destination), { recursive: true });
  if (format === 'avif') {
    await sharp(source).resize({ width, withoutEnlargement: true }).avif({ quality: 50 }).toFile(destination);
    return;
  }

  for (let quality = 72; quality >= 40; quality -= 4) {
    await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toFile(destination);
    const outputStat = await stat(destination);
    if (maxBytes === undefined || outputStat.size <= maxBytes) return;
  }

  throw new Error(`L’image WebP dépasse la limite de poids : ${destination}`);
}

async function ensureBlurredHero(source) {
  const sourceStat = await stat(source);
  const variants = [
    { width: 1600, height: 900, maxBytes: 150 * 1024 },
    { width: 828, height: 466, maxBytes: 80 * 1024 },
  ];

  for (const { width, height, maxBytes } of variants) {
    const destination = path.join(outputRoot, 'hero', `hero-background-${width}.webp`);
    try {
      const outputStat = await stat(destination);
      if (outputStat.mtimeMs >= sourceStat.mtimeMs && outputStat.size <= maxBytes) continue;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }

    await mkdir(path.dirname(destination), { recursive: true });
    let output;
    for (let quality = 82; quality >= 42; quality -= 4) {
      output = await sharp(source)
        .resize(width, height, { fit: 'cover', position: 'attention' })
        .blur(7)
        .webp({ quality, effort: 6 })
        .toBuffer();
      if (output.byteLength <= maxBytes) break;
    }
    if (!output || output.byteLength > maxBytes) {
      throw new Error(`L’image hero floutée dépasse ${Math.round(maxBytes / 1024)} Ko : ${destination}`);
    }
    await writeFile(destination, output);
  }
}

const entries = {};
const images = (await findImages(sourceRoot)).sort();
let heroBackgroundSource;
for (const candidate of heroBackgroundCandidates) {
  try {
    await stat(candidate);
    heroBackgroundSource = candidate;
    break;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}
if (heroBackgroundSource) {
  await ensureBlurredHero(heroBackgroundSource);
} else {
  console.warn('Aucune image hero disponible : le fond restera brun uni.');
}

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
