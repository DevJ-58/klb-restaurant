import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const flag = process.argv[index];
  const next = process.argv[index + 1];
  if (flag.startsWith('--')) {
    args.set(flag, next && !next.startsWith('--') ? next : 'true');
    if (next && !next.startsWith('--')) {
      index += 1;
    }
  }
}

const mode = args.get('--mode') ?? 'baseline';
const theme = args.get('--theme') ?? 'dark';
const baseUrl = process.env.KLB_BASE_URL ?? 'http://127.0.0.1:5173';
const pages = ['/', '/carte', '/ambiance', '/nous-trouver', '/unknown'];
const sizes = [
  { width: 375, height: 800 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

function slugify(value) {
  const sanitized = value.replace(/^\//, '').replace(/\//g, '-').replace(/\?.*$/, '');
  return sanitized || 'home';
}

async function capturePage(page, route, width, height, selectedTheme) {
  await page.setViewportSize({ width, height });
  await page.addInitScript((themeKey, themeValue) => {
    localStorage.setItem(themeKey, themeValue);
  }, ['klb-theme', selectedTheme]);
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: '*, *::before, *::after { cursor: auto !important; } .cursor, .cursor-light { display: none !important; }' });
  const buffer = await page.screenshot({ fullPage: true, type: 'png' });
  const targetDir = path.join(rootDir, 'snapshots', selectedTheme);
  await fs.mkdir(targetDir, { recursive: true });
  const outputPath = path.join(targetDir, `${slugify(route)}-${width}.png`);
  await fs.writeFile(outputPath, buffer);
  return outputPath;
}

async function runBaseline() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: 'reduce', colorScheme: theme });
  const page = await context.newPage();
  for (const { width, height } of sizes) {
    for (const route of pages) {
      await capturePage(page, route, width, height, theme);
    }
  }
  await browser.close();
}

async function runCompare() {
  const currentDir = path.join(rootDir, 'snapshots', theme);
  const baselineDir = path.join(rootDir, 'snapshots', 'baseline');
  const files = [];

  for (const { width } of sizes) {
    for (const route of pages) {
      const currentPath = path.join(currentDir, `${slugify(route)}-${width}.png`);
      const baselinePath = path.join(baselineDir, `${slugify(route)}-${width}.png`);
      const baselineExists = await fs.access(baselinePath).then(() => true).catch(() => false);
      const sourcePath = baselineExists ? baselinePath : currentPath;
      if (!await fs.access(currentPath).then(() => true).catch(() => false)) {
        continue;
      }
      files.push({ currentPath, sourcePath, label: `${slugify(route)}-${width}` });
    }
  }

  let failures = 0;
  for (const { currentPath, sourcePath, label } of files) {
    const current = PNG.sync.read(await fs.readFile(currentPath));
    const baseline = PNG.sync.read(await fs.readFile(sourcePath));
    const diff = new PNG({ width: current.width, height: current.height });
    const diffPixels = pixelmatch(current.data, baseline.data, diff.data, current.width, current.height, { threshold: 0.1 });
    const percent = (diffPixels / (current.width * current.height)) * 100;
    console.log(`${label}: ${percent.toFixed(4)}% pixels different`);
    if (percent > 0.05) {
      failures += 1;
    }
  }

  process.exit(failures > 0 ? 1 : 0);
}

if (mode === 'compare') {
  await runCompare();
} else {
  await runBaseline();
}
