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
const baseUrl = (args.get('--base-url') ?? process.env.KLB_BASE_URL ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const outputDir = path.resolve(rootDir, args.get('--out') ?? `snapshots/${theme}`);
const referenceDir = path.resolve(rootDir, args.get('--reference') ?? 'snapshots/baseline-dark');
const diffDir = args.has('--diff-dir') ? path.resolve(rootDir, args.get('--diff-dir')) : null;
const maskMobileHeader = args.has('--mask-mobile-header');
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

function maskHeader(png, width) {
  if (!maskMobileHeader || width !== 375) {
    return;
  }

  const maskHeight = Math.min(96, png.height);
  for (let y = 0; y < maskHeight; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const offset = (y * png.width + x) * 4;
      png.data[offset] = 0;
      png.data[offset + 1] = 0;
      png.data[offset + 2] = 0;
      png.data[offset + 3] = 255;
    }
  }
}

async function capturePage(page, route, width, height, selectedTheme) {
  await page.setViewportSize({ width, height });
  await page.addInitScript(({ themeKey, themeValue }) => {
    localStorage.setItem(themeKey, themeValue);
  }, { themeKey: 'klb-theme', themeValue: selectedTheme });
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: '*, *::before, *::after { cursor: auto !important; } .cursor, .cursor-light { display: none !important; }' });
  const png = PNG.sync.read(await page.screenshot({ fullPage: true, type: 'png' }));
  maskHeader(png, width);
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${slugify(route)}-${width}.png`);
  await fs.writeFile(outputPath, PNG.sync.write(png));
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
  let failures = 0;
  let compared = 0;

  for (const { width } of sizes) {
    for (const route of pages) {
      const name = `${slugify(route)}-${width}.png`;
      const currentPath = path.join(outputDir, name);
      const referencePath = path.join(referenceDir, name);
      try {
      await fs.access(currentPath);
      await fs.access(referencePath);
      } catch {
      console.error(`${name}: missing current or reference snapshot`);
      failures += 1;
      continue;
      }

      const current = PNG.sync.read(await fs.readFile(currentPath));
      const reference = PNG.sync.read(await fs.readFile(referencePath));
      if (current.width !== reference.width || current.height !== reference.height) {
      console.error(
        `${name}: dimension mismatch current=${current.width}x${current.height} reference=${reference.width}x${reference.height}`,
      );
      failures += 1;
      continue;
      }

      maskHeader(current, width);
      maskHeader(reference, width);
      const diff = new PNG({ width: current.width, height: current.height });
      const diffPixels = pixelmatch(
      current.data,
      reference.data,
      diff.data,
      current.width,
      current.height,
      { threshold: 0.1 },
      );
      const percent = (diffPixels / (current.width * current.height)) * 100;
      console.log(`${name}: ${percent.toFixed(4)}% pixels different`);
      compared += 1;
      if (diffPixels > 0 && diffDir) {
      await fs.mkdir(diffDir, { recursive: true });
      await fs.writeFile(path.join(diffDir, name), PNG.sync.write(diff));
      }
      if (percent > 0.05) {
      failures += 1;
      }
    }
  }

  console.log(`Compared ${compared}/${pages.length * sizes.length} images; failures=${failures}`);
  process.exit(failures > 0 ? 1 : 0);
}

if (mode === 'compare') {
  await runCompare();
} else {
  await runBaseline();
}
