import { chromium } from 'playwright';

const BASE_URL = process.env.URL || 'http://localhost:4173';
const ROUTES = ['/', '/carte', '/nous-trouver', '/ambiance'];
const SIZES = [
  [320, 568],
  [375, 667],
  [390, 844],
  [667, 375],
  [768, 1024],
  [1024, 768],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
];
const ALLOWED_OVERFLOW = [
  '.ambiance-viewport',
  '.ambiance-track',
  '.featured-track',
  '.featured-panels',
  '.marquee-track',
];
let failed = false;

const browser = await chromium.launch();
for (const [width, height] of SIZES) {
  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(new URL(route, BASE_URL).toString(), { waitUntil: 'domcontentloaded' });
    await page.locator('main h1').first().waitFor({ state: 'attached', timeout: 15_000 });
    await page.waitForFunction(
      () => !document.querySelector('.loader-overlay'),
      null,
      { timeout: 15_000 },
    );
    const result = await page.evaluate((allowedOverflow) => {
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          Number.parseFloat(style.opacity) > 0 &&
          rect.width > 0 &&
          rect.height > 0
        );
      };
      const overflow = Array.from(document.body.querySelectorAll('*'))
        .filter((element) => visible(element))
        .filter((element) => element.getBoundingClientRect().width > innerWidth + 1)
        .filter((element) => !allowedOverflow.some((selector) => element.matches(selector) || element.closest(selector)))
        .map((element) => ({
          selector: element.tagName.toLowerCase() +
            (element.id ? `#${element.id}` : '') +
            (typeof element.className === 'string' && element.className.trim()
              ? `.${element.className.trim().split(/\s+/).join('.')}`
              : ''),
          width: Math.round(element.getBoundingClientRect().width),
        }));
      const smallTargets = Array.from(document.querySelectorAll('a[href], button'))
        .filter((element) => visible(element))
        .map((element) => ({
          selector: element.tagName.toLowerCase() +
            (element.id ? `#${element.id}` : '') +
            (typeof element.className === 'string' && element.className.trim()
              ? `.${element.className.trim().split(/\s+/).join('.')}`
              : ''),
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
          inlineException:
            element.matches('p a, li a, address a, dd a') &&
            getComputedStyle(element).display === 'inline',
        }))
        .filter(({ width, height, inlineException }) =>
          !inlineException && (width < 44 || height < 44),
        );
      return {
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
        oversizedElements: overflow,
        smallTargets,
        h1Count: document.querySelectorAll('main h1').length,
      };
    }, ALLOWED_OVERFLOW);
    const passed =
      result.scrollWidth <= result.viewportWidth &&
      result.oversizedElements.length === 0 &&
      result.smallTargets.length === 0 &&
      result.h1Count === 1;
    console.log(`${width}x${height} ${route}: ${passed ? 'PASS' : 'FAIL'}`, result);
    if (!passed) failed = true;
    await page.close();
  }
}
await browser.close();

if (process.env.SKIP_SCROLL_AUDIT !== '1') {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync(process.execPath, ['scripts/audit-scroll.mjs'], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) failed = true;
}

process.exit(failed ? 1 : 0);
