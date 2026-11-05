import { chromium } from 'playwright';

const BASE_URL = process.env.URL || 'http://localhost:4173';
const ROUTES = ['/', '/carte', '/nous-trouver', '/ambiance'];
let failed = false;

const browser = await chromium.launch();
for (const route of ROUTES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(new URL(route, BASE_URL).toString(), { waitUntil: 'domcontentloaded' });
  await page.locator('main h1').first().waitFor({ state: 'attached', timeout: 15_000 });
  await page.waitForFunction(
    () => !document.querySelector('.loader-overlay'),
    null,
    { timeout: 15_000 },
  );
  await page.locator('body').click({ position: { x: 2, y: 2 } });
  const invalid = [];
  for (let index = 0; index < 60; index += 1) {
    await page.keyboard.press('Tab');
    const result = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement)) return { error: 'no focused HTMLElement' };
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const inViewport =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= innerHeight &&
        rect.right <= innerWidth;
      const centerElement = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
      const unobscured = Boolean(centerElement && (centerElement === element || element.contains(centerElement)));
      const outlineVisible =
        style.outlineStyle !== 'none' &&
        Number.parseFloat(style.outlineWidth) > 0 &&
        style.outlineColor !== 'transparent' &&
        style.outlineColor !== 'rgba(0, 0, 0, 0)';
      const boxShadowVisible = style.boxShadow !== 'none';
      const focusVisible = element.matches(':focus-visible');
      const header = document.querySelector('header');
      const actionbar = document.querySelector('[data-actionbar]');
      const headerCovered = header ? rect.top < header.getBoundingClientRect().bottom && rect.bottom > header.getBoundingClientRect().top : false;
      const actionbarCovered = actionbar ? rect.bottom > actionbar.getBoundingClientRect().top : false;
      return {
        element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}`,
        inViewport,
        unobscured,
        focusVisible,
        outlineVisible: outlineVisible || boxShadowVisible,
        headerCovered,
        actionbarCovered,
      };
    });
    if (
      result.error ||
      !result.inViewport ||
      !result.unobscured ||
      !result.focusVisible ||
      !result.outlineVisible ||
      result.headerCovered ||
      result.actionbarCovered
    ) {
      invalid.push({ tab: index + 1, ...result });
    }
  }
  console.log(`${route}: ${invalid.length ? 'FAIL' : 'PASS'} (${invalid.length} invalid focus stops)`);
  invalid.forEach((result) => console.log(result));
  if (invalid.length) failed = true;
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
