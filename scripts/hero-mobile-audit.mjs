import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.KLB_BASE_URL || 'http://127.0.0.1:4173';
const outputDirectory = path.resolve('snapshots/hero-mobile-audit');
const viewports = [
  [360, 844],
  [375, 844],
  [390, 844],
  [412, 844],
  [430, 844],
  [768, 1024],
];
const failures = [];
const results = [];
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await fs.mkdir(outputDirectory, { recursive: true });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('#klb-preloader').waitFor({ state: 'detached', timeout: 10_000 });
  await page.locator('.hero-carousel-thumbnail').first().waitFor({ state: 'visible' });

  const pauseButton = page.getByRole('button', {
    name: 'Mettre en pause le défilement automatique',
  });
  if (await pauseButton.isVisible()) await pauseButton.click();

  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);

    const layout = await page.evaluate(() => {
      const mobile = innerWidth < 768;
      const root = document.querySelector('.home-hero');
      const content = document.querySelector('.home-hero-layout');
      const headerLogo = document.querySelector(
        mobile ? '.mobile-logo-image' : '.header-logo-image',
      );
      const selectors = {
        klb: '.home-hero-title-klb',
        restaurant: '.home-hero-title-restaurant',
        description: mobile
          ? '.home-hero-subtitle--mobile'
          : '.home-hero-subtitle--desktop',
        badge: '.home-hero-open-status',
        cardButton: '.home-hero-button-primary',
        roundButton: '.home-hero-button-secondary',
        dish: '.hero-platter',
        dishLabel: '.hero-dish-name',
        thumbnails: '.hero-carousel-thumbnails',
        controls: '.hero-carousel-controls',
      };
      const bounds = (element) => {
        if (!element) return null;
        const { left, top, right, bottom, width, height } =
          element.getBoundingClientRect();
        return { left, top, right, bottom, width, height };
      };
      const elements = Object.fromEntries(
        Object.entries(selectors).map(([name, selector]) => [
          name,
          document.querySelector(selector),
        ]),
      );
      const spacing = (first, second) =>
        elements[first] && elements[second]
          ? elements[second].getBoundingClientRect().top -
            elements[first].getBoundingClientRect().bottom
          : null;
      const descriptionStyle = getComputedStyle(elements.description);
      const titleStyle = getComputedStyle(elements.klb);
      const restaurantStyle = getComputedStyle(elements.restaurant);
      const subtitleLineHeight = parseFloat(descriptionStyle.lineHeight);
      const subtitleBounds = bounds(elements.description);
      const actionBar = document.querySelector('[data-actionbar]');
      const leftGutter = mobile
        ? parseFloat(getComputedStyle(content).paddingLeft)
        : bounds(document.querySelector('.home-hero-copy')).left;
      const rightGutter = mobile
        ? parseFloat(getComputedStyle(content).paddingRight)
        : leftGutter;
      const textRight = Math.max(
        bounds(elements.klb)?.right ?? 0,
        bounds(elements.restaurant)?.right ?? 0,
        subtitleBounds?.right ?? 0,
        bounds(elements.badge)?.right ?? 0,
      );
      const textChecks = [
        elements.description,
        elements.badge,
        elements.cardButton,
        elements.dishLabel,
      ]
        .filter(Boolean)
        .map((element) => {
          const style = getComputedStyle(element);
          return {
            text: element.textContent.trim(),
            scrollHeight: element.scrollHeight,
            clientHeight: element.clientHeight,
            textOverflow: style.textOverflow,
            lineClamp: style.webkitLineClamp,
          };
        });
      const veilStyle = getComputedStyle(document.querySelector('.home-hero-veil'));
      const veil = veilStyle.backgroundColor.match(/[\d.]+/g).map(Number);
      const foreground = descriptionStyle.color.match(/[\d.]+/g).map(Number);
      const composite = foreground.map((_, channel) => veil[channel] * veil[3] + 255 * (1 - veil[3]));
      const luminance = (channels) => {
        const [red, green, blue] = channels.map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      };
      const contrast = (Math.max(luminance(foreground), luminance(composite)) + 0.05) /
        (Math.min(luminance(foreground), luminance(composite)) + 0.05);

      return {
        mobile,
        viewportWidth: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        headerLogo: bounds(headerLogo),
        elements: Object.fromEntries(
          Object.entries(elements).map(([name, element]) => [name, bounds(element)]),
        ),
        textRight,
        leftGutter,
        rightGutter,
        subtitleLines: subtitleBounds
          ? Math.round(subtitleBounds.height / subtitleLineHeight)
          : null,
        subtitleFontSize: parseFloat(descriptionStyle.fontSize),
        subtitleLineHeight,
        titleFontSize: parseFloat(titleStyle.fontSize),
        titleLineHeight: parseFloat(titleStyle.lineHeight),
        restaurantFontSize: parseFloat(restaurantStyle.fontSize),
        textChecks,
        contrast,
        spacing: {
          klbToRestaurant: spacing('klb', 'restaurant'),
          restaurantToDescription: spacing('restaurant', 'description'),
          descriptionToBadge: spacing('description', 'badge'),
          badgeToButtons: spacing('badge', 'cardButton'),
          buttonsToDish: spacing('cardButton', 'dish'),
          dishToLabel: spacing('dish', 'dishLabel'),
          labelToThumbnails: spacing('dishLabel', 'thumbnails'),
          thumbnailsToControls: spacing('thumbnails', 'controls'),
        },
        actionBar: bounds(actionBar),
      };
    });

    await page.evaluate(
      ({ mobile, leftGutter, rightGutter }) => {
        document.querySelector('#hero-margin-grid')?.remove();
        const grid = document.createElement('div');
        grid.id = 'hero-margin-grid';
        Object.assign(grid.style, {
          position: 'absolute',
          inset: '0',
          height: `${document.documentElement.scrollHeight}px`,
          zIndex: '99999',
          pointerEvents: 'none',
        });
        for (const [edge, offset] of [
          ['left', leftGutter],
          ['right', rightGutter],
        ]) {
          const line = document.createElement('div');
          Object.assign(line.style, {
            position: 'absolute',
            top: '0',
            bottom: '0',
            [edge]: `${offset}px`,
            borderLeft: '1px dashed #ffd36b',
          });
          grid.append(line);
          const label = document.createElement('span');
          label.textContent = `${mobile ? 'gutter' : 'marge'} ${offset.toFixed(1)}px`;
          Object.assign(label.style, {
            position: 'absolute',
            top: '4px',
            [edge]: `${offset + 3}px`,
            padding: '2px 4px',
            background: '#0b0806',
            color: '#ffd36b',
            font: '11px/1.2 sans-serif',
            whiteSpace: 'nowrap',
          });
          grid.append(label);
        }
        document.body.append(grid);
      },
      {
        mobile: layout.mobile,
        leftGutter: layout.leftGutter,
        rightGutter: layout.rightGutter,
      },
    );

    const problems = [];
    const leftEdges = [
      layout.headerLogo?.left,
      layout.elements.klb?.left,
      layout.elements.restaurant?.left,
      layout.elements.description?.left,
      layout.elements.badge?.left,
      layout.elements.cardButton?.left,
    ].filter(Number.isFinite);
    if (layout.mobile && leftEdges.some((edge) => Math.abs(edge - leftEdges[0]) > 1)) {
      problems.push(`bords gauches désalignés: ${leftEdges.map((edge) => edge.toFixed(1)).join(', ')}`);
    }

    const contentBounds = [
      ['logo', layout.headerLogo],
      ...Object.entries(layout.elements),
    ].filter(([, rect]) => rect && rect.width > 0 && rect.height > 0);
    for (const [name, rect] of contentBounds) {
      if (rect.left < -1 || rect.right > width + 1) {
        problems.push(`${name} dépasse l'écran (${rect.left.toFixed(1)}–${rect.right.toFixed(1)})`);
      }
      if (
        layout.mobile &&
        (rect.left < layout.leftGutter - 1 || rect.right > width - layout.rightGutter + 1)
      ) {
        problems.push(`${name} dépasse le gutter (${rect.left.toFixed(1)}–${rect.right.toFixed(1)})`);
      }
    }
    if (layout.textRight > width - layout.rightGutter + 1) {
      problems.push(`texte trop près du bord droit (${layout.textRight.toFixed(1)})`);
    }
    if (layout.scrollWidth > width) {
      problems.push(`défilement horizontal du document (${layout.scrollWidth}px)`);
    }
    for (const check of layout.textChecks) {
      if (
        check.scrollHeight > check.clientHeight ||
        check.textOverflow === 'ellipsis' ||
        (check.lineClamp !== 'none' && check.lineClamp !== '0' && check.text.includes('Restaurant et'))
      ) {
        problems.push(`texte tronqué: "${check.text}"`);
      }
    }

    if (layout.mobile) {
      const expectedLines = width === 360 ? 4 : 3;
      if (layout.subtitleLines > expectedLines) {
        problems.push(`description sur ${layout.subtitleLines} lignes (maximum ${expectedLines})`);
      }
      const expectedTitleSize = Math.min(176, Math.max(104, width * 0.34));
      if (Math.abs(layout.titleFontSize - expectedTitleSize) > 1) {
        problems.push(`taille KLB inattendue (${layout.titleFontSize}px)`);
      }
      if (Math.abs(layout.titleLineHeight / layout.titleFontSize - 0.85) > 0.01) {
        problems.push('interlignage KLB différent de 0.85');
      }
      if (Math.abs(layout.restaurantFontSize - Math.max(22, layout.titleFontSize * 0.3)) > 1) {
        problems.push(`taille Restaurant inattendue (${layout.restaurantFontSize}px)`);
      }
      if (layout.subtitleFontSize !== 17 || Math.abs(layout.subtitleLineHeight - 25.5) > 0.1) {
        problems.push(`typographie de description inattendue (${layout.subtitleFontSize}px / ${layout.subtitleLineHeight}px)`);
      }
      if (layout.contrast < 4.5) {
        problems.push(`contraste sous AA (${layout.contrast.toFixed(2)}:1)`);
      }
      const expectedSpacing = {
        klbToRestaurant: 4,
        restaurantToDescription: 16,
        descriptionToBadge: 14,
        badgeToButtons: 20,
        buttonsToDish: 28,
        dishToLabel: 16,
        labelToThumbnails: 16,
        thumbnailsToControls: 12,
      };
      for (const [name, expected] of Object.entries(expectedSpacing)) {
        if (Math.abs(layout.spacing[name] - expected) > 1) {
          problems.push(`${name}: ${layout.spacing[name]?.toFixed(1)}px au lieu de ${expected}px`);
        }
      }
      if (Math.abs(layout.elements.roundButton.right - (width - layout.rightGutter)) > 1) {
        problems.push('bouton rond non aligné sur le gutter droit');
      }
    }

    await page.screenshot({
      path: path.join(outputDirectory, `hero-${width}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    await page.evaluate(() => document.querySelector('#hero-margin-grid')?.remove());

    results.push({
      width,
      leftEdges: leftEdges.map((edge) => Number(edge.toFixed(1))),
      rightButton: Number(layout.elements.roundButton.right.toFixed(1)),
      textRight: Number(layout.textRight.toFixed(1)),
      gutter: `${layout.leftGutter.toFixed(1)} / ${layout.rightGutter.toFixed(1)}`,
      descriptionLines: layout.subtitleLines,
      contrast: Number(layout.contrast.toFixed(2)),
      spacing: layout.spacing,
      problems,
    });
    console.log(`${width}px: ${JSON.stringify(results.at(-1))}`);
    failures.push(...problems.map((problem) => `${width}px: ${problem}`));
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('Échecs du test hero mobile :\n' + failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Hero validée aux largeurs ${viewports.map(([width]) => width).join(', ')}px. ` +
      `Captures annotées : ${outputDirectory}`,
  );
}
