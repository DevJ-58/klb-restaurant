import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const imageRoot = path.join(root, 'public', 'images');
const files = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(fullPath);
    else if (/\.(avif|gif|jpe?g|png|webp)$/i.test(entry.name)) files.push(fullPath);
  }
}

await collect(imageRoot);
files.sort();
const rows = [];
for (const filename of files) {
  const metadata = await sharp(filename).metadata();
  const { size } = await stat(filename);
  rows.push({
    file: `public/images/${path.relative(imageRoot, filename).replaceAll(path.sep, '/')}`,
    bytes: size,
    dimensions: `${metadata.width ?? '?'} × ${metadata.height ?? '?'}`,
  });
}
const total = rows.reduce((sum, item) => sum + item.bytes, 0);
const report = [
  '## Inventaire des images originales',
  '',
  `Total : ${rows.length} fichiers, ${total.toLocaleString('fr-FR')} octets. Les images dépassant 500 Ko sont signalées.`,
  '',
  '| Fichier | Dimensions | Poids | > 500 Ko |',
  '|---|---:|---:|:---:|',
  ...rows.map(({ file, bytes, dimensions }) =>
    `| \`${file}\` | ${dimensions} | ${(bytes / 1024).toFixed(1)} Ko | ${bytes > 500 * 1024 ? 'Oui' : 'Non'} |`,
  ),
  '',
];
const output = path.join(root, 'docs', 'PHASE9-RAPPORT.md');
let existing = '';
try {
  existing = await (await import('node:fs/promises')).readFile(output, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
const marker = '## Inventaire des images originales';
const index = existing.indexOf(marker);
const updated = index >= 0
  ? `${existing.slice(0, index).trimEnd()}\n\n${report.join('\n')}`
  : `${existing.trimEnd()}\n\n${report.join('\n')}`;
await writeFile(output, updated, 'utf8');
console.log(`Inventaire d’images ajouté au rapport (${rows.length} actifs).`);
