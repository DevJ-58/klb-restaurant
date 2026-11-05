import { chromium } from 'playwright';

const URL = process.env.URL || 'http://localhost:5173/';
const browser = await chromium.launch(
  process.env.CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
    : {},
);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

const locations = await page.evaluate(() => {
  const sections = {
    hero: document.querySelector('.home-hero'),
    incontournables: document.querySelector('.featured-section'),
    marquee: document.querySelector('.marquee-section'),
    footer: document.querySelector('.site-footer'),
  };
  const alignActionBarCenter = (element) => {
    const bar = document.querySelector('[data-actionbar]');
    const probeY = window.innerHeight - (bar?.offsetHeight ?? 0) / 2;
    return element.getBoundingClientRect().top + window.scrollY - probeY + 10;
  };
  const absoluteCenter = (element) =>
    element.getBoundingClientRect().top + window.scrollY + element.offsetHeight / 2;

  return {
    hero: 0,
    incontournables: sections.incontournables
      ? absoluteCenter(sections.incontournables)
      : 0,
    marquee: sections.marquee ? alignActionBarCenter(sections.marquee) : 0,
    footer: sections.footer ? alignActionBarCenter(sections.footer) : 0,
  };
});

for (const [label, scrollY] of Object.entries(locations)) {
  await page.evaluate((position) => window.scrollTo(0, position), scrollY);
  await page.waitForTimeout(500);
  const snapshot = await page.evaluate(async () => {
    const bar = document.querySelector('.action-bar');
    if (!bar) {
      return { missing: true };
    }

    const style = getComputedStyle(bar);
    const rect = bar.getBoundingClientRect();
    const point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const ancestors = [];
    let ancestor = bar.parentElement;
    while (ancestor) {
      const current = getComputedStyle(ancestor);
      const values = {
        tag: ancestor.tagName.toLowerCase(),
        className: typeof ancestor.className === 'string' ? ancestor.className : '',
        transform: current.transform,
        filter: current.filter,
        willChange: current.willChange,
        contain: current.contain,
        isolation: current.isolation,
        opacity: current.opacity,
        position: current.position,
        zIndex: current.zIndex,
      };
      if (
        values.transform !== 'none' ||
        values.filter !== 'none' ||
        values.willChange !== 'auto' ||
        values.contain !== 'none' ||
        values.isolation === 'isolate' ||
        Number(values.opacity) < 1 ||
        (values.position !== 'static' && values.zIndex !== 'auto')
      ) {
        ancestors.push(values);
      }
      ancestor = ancestor.parentElement;
    }

    let gsapDiagnostics = {};
    try {
      const resources = performance.getEntriesByType('resource').map((entry) => entry.name);
      const gsapUrl = resources.find((url) => /\/gsap\.js\?/.test(url));
      const scrollTriggerUrl = resources.find((url) => /\/gsap_ScrollTrigger\.js\?/.test(url));
      if (!gsapUrl || !scrollTriggerUrl) {
        throw new Error('Vite GSAP runtime modules are not present in the page resource list.');
      }
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import(gsapUrl),
        import(scrollTriggerUrl),
      ]);
      gsapDiagnostics = {
        tweens: gsap.getTweensOf(bar).map((tween) => ({
          targets: tween.targets().map((target) => target.className),
          vars: tween.vars,
          progress: tween.progress(),
        })),
        triggers: ScrollTrigger.getAll()
          .filter((trigger) => {
            const triggerElement = trigger.trigger;
            const triggerInBar =
              triggerElement instanceof Element &&
              (triggerElement === bar || bar.contains(triggerElement));
            const targets =
              trigger.animation && typeof trigger.animation.targets === 'function'
                ? trigger.animation.targets()
                : [];
            const targetInBar = targets.some(
              (target) => target instanceof Element && (target === bar || bar.contains(target)),
            );
            return triggerInBar || targetInBar;
          })
          .map((trigger) => ({
            trigger: trigger.trigger?.className ?? null,
            start: trigger.start,
            end: trigger.end,
            progress: trigger.progress,
            targets: trigger.animation?.targets?.().map((target) => target.className) ?? [],
          })),
      };
    } catch (error) {
      gsapDiagnostics = { error: String(error) };
    }

    return {
      style: {
        theme: bar.dataset.on,
        opacity: style.opacity,
        visibility: style.visibility,
        transform: style.transform,
        zIndex: style.zIndex,
        pointerEvents: style.pointerEvents,
        backgroundColor: style.backgroundColor,
      },
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
      },
      hitTest: document.elementsFromPoint(point.x, point.y).slice(0, 5).map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
      })),
      ancestors,
      gsapDiagnostics,
    };
  });
  console.log(`\n${label} (scrollY=${Math.round(scrollY)}):\n${JSON.stringify(snapshot, null, 2)}`);
}

await browser.close();
