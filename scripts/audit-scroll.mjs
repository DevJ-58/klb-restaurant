import { chromium } from 'playwright';

const HOME_URL = process.env.URL || 'http://localhost:5173/';
const CARTE_URL = process.env.CARTE_URL || 'http://localhost:5173/carte';
const NOUS_TROUVER_URL = process.env.NOUS_TROUVER_URL || 'http://localhost:5173/nous-trouver';
const SIZES = [[1440, 900], [375, 667]];

async function checkActionBar(page, label) {
  const result = await page.evaluate(() => {
    const bar = document.querySelector('[data-actionbar]');
    if (!bar) return { error: 'missing [data-actionbar]' };
    const style = getComputedStyle(bar);
    const rect = bar.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      opacity: Number.parseFloat(style.opacity),
      rect: { top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left },
      viewport: { width: innerWidth, height: innerHeight },
      inside: rect.top >= 0 && rect.left >= 0 && rect.bottom <= innerHeight && rect.right <= innerWidth,
      uncovered: Boolean(hit?.closest('[data-actionbar]')),
      hit: hit?.tagName.toLowerCase() ?? null,
    };
  });
  const passed =
    !result.error && result.opacity >= 0.99 && result.inside && result.uncovered;
  if (!passed) {
    failed = true;
    console.error(`${label} actionbar check failed:`, result);
  }
  return passed;
}

async function countVisibleContent(page) {
  return page.evaluate(() => {
    const vh = window.innerHeight;
    let count = 0;
    document.querySelectorAll('[data-content]').forEach((el) => {
      if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return;
      if (Number.parseFloat(getComputedStyle(el).opacity) < 0.3) return;
      const rect = el.getBoundingClientRect();
      const seen = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      if (seen > 24 && rect.width > 24) count += 1;
    });
    return count;
  });
}

async function getPageSnapshot(page) {
  return page.evaluate(() => ({
    pinSpacers: document.querySelectorAll('.pin-spacer').length,
    scrollTriggerCount: window.ScrollTrigger ? window.ScrollTrigger.getAll().length : 0,
    heroImageWidth: document.querySelector('.hero-dish-image img')?.naturalWidth ?? 0,
    footerPosition: getComputedStyle(document.querySelector('footer')).position,
    footerIsStatic: ['static', 'relative'].includes(getComputedStyle(document.querySelector('footer')).position),
  }));
}

let failed = false;
const launchOptions = process.env.CHROMIUM_EXECUTABLE_PATH
  ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
  : {};

for (const [w, h] of SIZES) {
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  await page.goto(HOME_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('footer', { state: 'attached', timeout: 15000 });
  await page.waitForFunction(() => !document.querySelector('.loader-overlay'), null, { timeout: 15000 });
  await page.waitForTimeout(800);

  const initial = await getPageSnapshot(page);
  console.log(`${w}x${h} home initial:`, initial);
  await checkActionBar(page, `${w}x${h} home initial`);

  if (initial.pinSpacers !== 1) {
    failed = true;
    console.error(`Pin spacers expected 1 on home, received ${initial.pinSpacers}`);
  }

  if (!initial.footerIsStatic) {
    failed = true;
    console.error(`Footer position expected static/relative, received ${initial.footerPosition}`);
  }

  let lastHomeTriggerCount = initial.scrollTriggerCount;
  for (let index = 0; index < 3; index += 1) {
    await page.locator('.appetite-link').click();
    await page.waitForURL(CARTE_URL);
    await page.waitForTimeout(1100);
    await page.locator('a.header-logo:visible, a.mobile-logo:visible').first().click();
    await page.waitForURL(HOME_URL);
    await page.waitForTimeout(1100);
    const snapshot = await getPageSnapshot(page);
    console.log(`${w}x${h} round ${index + 1}:`, snapshot);
    if (snapshot.pinSpacers !== 1) {
      failed = true;
      console.error(`Round ${index + 1} pin spacers expected 1, received ${snapshot.pinSpacers}`);
    }
    if (snapshot.scrollTriggerCount !== lastHomeTriggerCount) {
      failed = true;
      console.error(`ScrollTrigger count changed from ${lastHomeTriggerCount} to ${snapshot.scrollTriggerCount}`);
    }
    lastHomeTriggerCount = snapshot.scrollTriggerCount;
  }

  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.round(h * 0.25);
  const empty = [];
  for (let y = 0; y <= total - h; y += step) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(1300);
    const visible = await countVisibleContent(page);
    if (visible < 1) empty.push(y);
    await checkActionBar(page, `${w}x${h} home scroll=${y}`);
  }

  console.log(`${w}x${h} | hauteur ${total} px | pas sans contenu : ${empty.length ? empty.join(', ') : 'aucun'}`);
  if (empty.length) {
    failed = true;
  }
  if (browserErrors.length) {
    failed = true;
    console.error(`${w}x${h} browser errors:`, browserErrors);
  }

  await browser.close();
}

for (const [w, h] of SIZES) {
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const carteErrors = [];
  page.on('pageerror', (error) => carteErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') carteErrors.push(message.text());
  });
  await page.goto(CARTE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('footer', { state: 'attached', timeout: 15000 });
  await page.waitForFunction(() => !document.querySelector('.loader-overlay'), null, { timeout: 15000 });
  await page.waitForTimeout(800);
  const carteFooter = await page.evaluate(() => getComputedStyle(document.querySelector('footer')).position);
  console.log(`${w}x${h} carte footer position: ${carteFooter}`);
  if (!['static', 'relative'].includes(carteFooter)) {
    failed = true;
  }
  const cartePinSpacers = await page.locator('.pin-spacer').count();
  if (cartePinSpacers !== 0) {
    failed = true;
    console.error(`${w}x${h} /carte expected 0 pin-spacer elements, received ${cartePinSpacers}`);
  }

  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.round(h * 0.25);
  const empty = [];
  for (let y = 0; y <= total - h; y += step) {
    await page.evaluate((position) => window.scrollTo(0, position), y);
    await page.waitForTimeout(1300);
    if ((await countVisibleContent(page)) < 1) empty.push(y);
    await checkActionBar(page, `${w}x${h} carte scroll=${y}`);
  }
  console.log(`${w}x${h} carte | hauteur ${total} px | pas sans contenu : ${empty.length ? empty.join(', ') : 'aucun'}`);
  if (empty.length) failed = true;
  if (carteErrors.length) {
    failed = true;
    console.error(`${w}x${h} carte browser errors:`, carteErrors);
  }
  await browser.close();
}

for (const [w, h] of SIZES) {
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  await page.goto(NOUS_TROUVER_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('footer', { state: 'attached', timeout: 15000 });
  await page.waitForFunction(() => !document.querySelector('.loader-overlay'), null, { timeout: 15000 });
  await page.waitForTimeout(800);

  const pageAudit = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    let structuredDataValid = true;
    for (const script of scripts) {
      try {
        JSON.parse(script.textContent ?? '');
      } catch {
        structuredDataValid = false;
      }
    }

    const buttons = Array.from(document.querySelectorAll('.faq-question-button'));
    const smallControls = Array.from(
      document.querySelectorAll('.find-us-primary-button, .find-us-whatsapp-button, .find-us-day-button'),
    );
    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      structuredDataCount: scripts.length,
      structuredDataValid,
      contentMarkers: {
        heading: Boolean(document.querySelector('h1[data-content]')),
        findUsTitle: Boolean(document.querySelector('#find-us-title[data-content]')),
        blocks: document.querySelectorAll('.find-us-block[data-content]').length,
        visual: Boolean(document.querySelector('.find-us-map-visual[data-content], .find-us-map-frame[data-content]')),
        faqButtons: buttons.length,
      },
      shortestControl: Math.min(...smallControls.map((control) => control.getBoundingClientRect().height)),
    };
  });
  console.log(`${w}x${h} /nous-trouver:`, pageAudit);
  await checkActionBar(page, `${w}x${h} /nous-trouver initial`);

  if (
    pageAudit.title !== 'Nous trouver — KLB Restaurant' ||
    pageAudit.description !== 'Adresse, horaires et contact de KLB Restaurant, quartier Morofé à Yamoussoukro.' ||
    pageAudit.horizontalOverflow ||
    pageAudit.structuredDataCount !== 2 ||
    !pageAudit.structuredDataValid ||
    !pageAudit.contentMarkers.heading ||
    !pageAudit.contentMarkers.findUsTitle ||
    pageAudit.contentMarkers.blocks !== 3 ||
    !pageAudit.contentMarkers.visual ||
    pageAudit.contentMarkers.faqButtons !== 5 ||
    pageAudit.shortestControl < 44
  ) {
    failed = true;
    console.error(`${w}x${h} /nous-trouver audit failed.`);
  }

  const questions = page.locator('.faq-question-button');
  await questions.nth(0).focus();
  await page.keyboard.press('Space');
  await questions.nth(1).focus();
  await page.keyboard.press('Enter');
  const expandedQuestions = await page.locator('.faq-question-button[aria-expanded="true"]').count();
  if (expandedQuestions !== 2) {
    failed = true;
    console.error(`${w}x${h} FAQ keyboard/multiple-open check failed: ${expandedQuestions} questions open.`);
  }

  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.round(h * 0.25);
  const empty = [];
  for (let y = 0; y <= total - h; y += step) {
    await page.evaluate((position) => window.scrollTo(0, position), y);
    await page.waitForTimeout(1300);
    if ((await countVisibleContent(page)) < 1) empty.push(y);
    await checkActionBar(page, `${w}x${h} /nous-trouver scroll=${y}`);
  }
  console.log(`${w}x${h} /nous-trouver | hauteur ${total} px | pas sans contenu : ${empty.length ? empty.join(', ') : 'aucun'}`);
  if (empty.length) failed = true;
  if (browserErrors.length) {
    failed = true;
    console.error(`${w}x${h} /nous-trouver browser errors:`, browserErrors);
  }
  await browser.close();
}

process.exit(failed ? 1 : 0);
