import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.URL || 'http://localhost:4173';
const ROUTES = ['/', '/carte', '/nous-trouver', '/ambiance'];
const SIZES = [[1440, 900], [375, 667]];
let failed = false;

for (const [width, height] of SIZES) {
  const browser = await chromium.launch();
  for (const route of ROUTES) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.goto(new URL(route, BASE_URL).toString(), { waitUntil: 'domcontentloaded' });
    await page.locator('main h1').first().waitFor({ state: 'attached', timeout: 15_000 });
    await page.waitForFunction(
      () => !document.querySelector('.loader-overlay'),
      null,
      { timeout: 15_000 },
    );
    const results = await new AxeBuilder({ page }).analyze();
    console.log(`${width}x${height} ${route}: ${results.violations.length} axe violations`);
    for (const violation of results.violations) {
      console.log(`  ${violation.id} [${violation.impact ?? 'unknown'}] ${violation.help}`);
      for (const node of violation.nodes) {
        console.log(`    ${node.target.join(', ')} — ${node.failureSummary?.replace(/\s+/g, ' ') ?? ''}`);
      }
      if (violation.impact === 'critical' || violation.impact === 'serious') {
        failed = true;
      }
    }
    await context.close();
  }
  await browser.close();
}

process.exit(failed ? 1 : 0);
