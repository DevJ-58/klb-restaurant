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
const baseUrl = (args.get('--base-url') ?? process.env.KLB_BASE_URL ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const outputDir = path.resolve(rootDir, args.get('--out') ?? 'snapshots/baseline');
const referenceDir = path.resolve(rootDir, args.get('--reference') ?? 'snapshots/ref-avant-retrait');
const diffDir = args.has('--diff-dir') ? path.resolve(rootDir, args.get('--diff-dir')) : null;
const pages = ['/', '/carte', '/ambiance', '/nous-trouver', '/unknown'];
const sizes = [
  { width: 375, height: 800 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];
const extraSnapshots = [
  { name: 'mobile-menu-375x800.png', width: 375, height: 800, route: '/', menu: true },
  { name: 'mobile-menu-390x844.png', width: 390, height: 844, route: '/', menu: true },
  { name: 'home-1440x900-viewport.png', width: 1440, height: 900, route: '/', menu: false },
];

function slugify(value) {
  const sanitized = value.replace(/^\//, '').replace(/\//g, '-').replace(/\?.*$/, '');
  return sanitized || 'home';
}

async function openPage(page, route, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    images.forEach((image) => {
      image.loading = 'eager';
    });
    await Promise.all(images.map(async (image) => {
      if (!image.complete) {
        await new Promise((resolve) => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        });
      }
      if (!image.isConnected) {
        return;
      }
      if (image.naturalWidth === 0) {
        await new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
        if (!image.isConnected) {
          return;
        }
        throw new Error(`Image failed to load: ${image.currentSrc || image.src}`);
      }
      await image.decode();
    }));
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: '*, *::before, *::after { cursor: auto !important; } .cursor, .cursor-light { display: none !important; }' });
}

async function saveScreenshot(page, name, fullPage = true) {
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, name);
  await fs.writeFile(outputPath, await page.screenshot({ fullPage, type: 'png' }));
  console.log(outputPath);
  return outputPath;
}

async function runBaseline() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const { width, height } of sizes) {
    for (const route of pages) {
      await openPage(page, route, width, height);
      await saveScreenshot(page, `${slugify(route)}-${width}.png`);
    }
  }
  for (const { name, width, height, route, menu } of extraSnapshots) {
    await openPage(page, route, width, height);
    if (menu) {
      await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
      await page.locator('.mobile-menu.is-open').waitFor();
      await page.waitForFunction(() => !document.querySelector('.mobile-menu')?.classList.contains('is-animating'));
      await page.waitForTimeout(800);
      await page.mouse.move(0, 0);
      await page.waitForTimeout(100);
    }
    await saveScreenshot(page, name, name !== 'home-1440x900-viewport.png');
  }
  await browser.close();
}

async function runCompare() {
  let failures = 0;
  let compared = 0;
  const snapshots = [
    ...sizes.flatMap(({ width }) => pages.map((route) => `${slugify(route)}-${width}.png`)),
    ...extraSnapshots.map(({ name }) => name),
  ];

  for (const name of snapshots) {
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

  console.log(`Compared ${compared}/${snapshots.length} images; failures=${failures}`);
  process.exit(failures > 0 ? 1 : 0);
}

if (mode === 'compare') {
  await runCompare();
} else {
  await runBaseline();
}
