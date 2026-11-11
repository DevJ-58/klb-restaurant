import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.KLB_BASE_URL || 'http://127.0.0.1:4173';
const outputDirectory = path.resolve('snapshots/editorial-hero');
const viewports = [
  [1920, 950],
  [1440, 900],
  [1280, 720],
  [1024, 768],
  [768, 1024],
  [430, 932],
  [390, 844],
  [360, 640],
];
const progressPoints = [0, 20, 40, 60];
const failures = [];
const report = [];
const backgroundCapture = process.env.KLB_BACKGROUND_LABEL;
const browser = await chromium.launch({ headless: true });

function rounded(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await fs.mkdir(outputDirectory, { recursive: true });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  if (backgroundCapture) {
    await page.locator('#klb-preloader').waitFor({ state: 'detached', timeout: 10_000 });
    await page.waitForFunction(() => {
      const image = document.querySelector('.home-hero-poster');
      return image?.complete && image.naturalWidth > 0;
    });
    await page.addStyleTag({
      content:
        '.home-hero > :not(.home-hero-media):not(.home-hero-veil) { visibility: hidden !important; }',
    });
    await page.locator('.home-hero').screenshot({
      path: path.join(outputDirectory, `background-${backgroundCapture}-1920x950.png`),
      animations: 'disabled',
    });
    const backgroundState = await page.evaluate(() => {
      const image = document.querySelector('.home-hero-poster');
      const veil = document.querySelector('.home-hero-veil');
      if (!image || !veil) throw new Error('Calque de fond/voile introuvable.');
      const imageStyle = getComputedStyle(image);
      const veilStyle = getComputedStyle(veil);
      return {
        image: {
          source: image.currentSrc,
          opacity: imageStyle.opacity,
          objectFit: imageStyle.objectFit,
          animationName: imageStyle.animationName,
          animationDuration: imageStyle.animationDuration,
          animationTimingFunction: imageStyle.animationTimingFunction,
          filter: imageStyle.filter,
        },
        veil: {
          background: veilStyle.backgroundColor,
          opacity: veilStyle.opacity,
          filter: veilStyle.filter,
        },
      };
    });
    await fs.writeFile(
      path.join(outputDirectory, `background-${backgroundCapture}-1920x950.json`),
      `${JSON.stringify(backgroundState, null, 2)}\n`,
    );
    console.log(`Fond ${backgroundCapture} : ${JSON.stringify(backgroundState)}`);
  } else {
    await page.locator('#klb-preloader').waitFor({ state: 'detached', timeout: 10_000 });
    await page.locator('.hero-title').waitFor({ state: 'visible', timeout: 10_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2300);

    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(250);

      const track = page.locator('.stage-scroll-track');
      const trackTop = await track.evaluate((element) => element.getBoundingClientRect().top + scrollY);
      const trackDistance = await track.evaluate(
        (element) => element.getBoundingClientRect().height - innerHeight,
      );
      if (trackDistance <= 0) {
        failures.push(`${width}x${height}: rail sticky sans progression.`);
        continue;
      }

      for (const progress of progressPoints) {
        await page.evaluate(
          ({ top, distance, amount }) => window.scrollTo(0, top + distance * amount / 100),
          { top: trackTop, distance: trackDistance, amount: progress },
        );
        await page.waitForTimeout(140);

        const state = await page.evaluate(() => {
          const scene = document.querySelector('.home-hero');
          const trackElement = document.querySelector('.stage-scroll-track');
          const nextSection = document.querySelector('.stage-content');
          const actionBar = document.querySelector('[data-actionbar]');
          const poster = document.querySelector('.home-hero-poster');
          const veil = document.querySelector('.home-hero-veil');
          const quote = document.querySelector('.hero-quote-title');
          const info = document.querySelector('.hero-info-bar');
          const subtitle = document.querySelector(
            '.hero-quote-subtitle:not(.hero-quote-subtitle--compact)',
          );
          const compactSubtitle = document.querySelector('.hero-quote-subtitle--compact');
          const title = document.querySelector('.hero-title-klb');
          const seal = document.querySelector('.hero-seal');
          const photoCanvas = document.querySelector('.hero-photo-canvas');

          if (!scene || !trackElement || !nextSection || !poster || !veil ||
              !quote || !info || !title || !seal || !photoCanvas) {
            return { error: 'Éléments hero absents.' };
          }

          const rect = (element) => {
            if (!element) return null;
            const bounds = element.getBoundingClientRect();
            return {
              left: bounds.left,
              top: bounds.top,
              right: bounds.right,
              bottom: bounds.bottom,
              width: bounds.width,
              height: bounds.height,
            };
          };
          const gap = (first, second) => {
            if (!first || !second) return null;
            const xGap = Math.max(first.left - second.right, second.left - first.right, 0);
            const yGap = Math.max(first.top - second.bottom, second.top - first.bottom, 0);
            if (xGap === 0 && yGap === 0) {
              return -Math.min(
                first.right - first.left,
                second.right - second.left,
                first.bottom - first.top,
                second.bottom - second.top,
              );
            }
            return Math.hypot(xGap, yGap);
          };
          const clippedRect = (element) => {
            const bounds = rect(element);
            const clip = rect(photoCanvas);
            if (!bounds || !clip) return null;
            const left = Math.max(bounds.left, clip.left);
            const top = Math.max(bounds.top, clip.top);
            const right = Math.min(bounds.right, clip.right);
            const bottom = Math.min(bounds.bottom, clip.bottom);
            if (right <= left || bottom <= top) return null;
            return { left, top, right, bottom, width: right - left, height: bottom - top };
          };

          const visibleSubtitle =
            subtitle && getComputedStyle(subtitle).display !== 'none'
              ? subtitle
              : compactSubtitle && getComputedStyle(compactSubtitle).display !== 'none'
                ? compactSubtitle
                : null;
          const quoteRect = rect(quote);
          const subtitleRect = rect(visibleSubtitle);
          const titleLetters = Array.from(scene.querySelectorAll('.hero-title-letter'));
          const titleRects = titleLetters.map(rect).filter(Boolean);
          const titleRect = titleRects.length
            ? {
                left: Math.min(...titleRects.map((item) => item.left)),
                top: Math.min(...titleRects.map((item) => item.top)),
                right: Math.max(...titleRects.map((item) => item.right)),
                bottom: Math.max(...titleRects.map((item) => item.bottom)),
              }
            : null;
          const photos = Array.from(scene.querySelectorAll('.hero-photo')).map((element) => ({
            name: element.className,
            rect: clippedRect(element),
          }));
          const photoPairs = [];
          for (let first = 0; first < photos.length; first += 1) {
            for (let second = first + 1; second < photos.length; second += 1) {
              const a = photos[first];
              const b = photos[second];
              if (a?.rect && b?.rect) {
                photoPairs.push({ names: [a.name, b.name], gap: gap(a.rect, b.rect) });
              }
            }
          }
          const textAndInfo = [quoteRect, subtitleRect, titleRect, rect(info)].filter(Boolean);
          const photoTextGaps = photos.flatMap((photo) =>
            photo.rect ? textAndInfo.map((item) => gap(photo.rect, item)) : [],
          );
          const otherPhotoGaps = photos
            .filter((photo) => !photo.name.includes('arch') && photo.rect)
            .map((photo) => gap(rect(seal), photo.rect));
          const sealTextGaps = textAndInfo.map((item) => gap(rect(seal), item));
          const computedAir = Number.parseFloat(getComputedStyle(scene).getPropertyValue('--air'));
          const imageStyle = getComputedStyle(poster);
          const veilStyle = getComputedStyle(veil);
          const trackBounds = rect(trackElement);
          const nextBounds = rect(nextSection);
          const actionBounds = rect(actionBar);
          const allTitleLettersInside = titleRects.every(
            (item) => item.left >= 0 && item.right <= innerWidth && item.top >= 0 && item.bottom <= innerHeight,
          );
          const textBlocks = [quote, visibleSubtitle].filter(Boolean).map((element) => {
            const style = getComputedStyle(element);
            return {
              text: element.textContent.trim(),
              overflow: style.textOverflow,
              clamp: style.webkitLineClamp,
              clientHeight: element.clientHeight,
              scrollHeight: element.scrollHeight,
            };
          });
          const quoteLines = Array.from(quote.querySelectorAll('.hero-quote-mask')).map((element) => {
            const style = getComputedStyle(element);
            return {
              text: element.textContent.trim(),
              whiteSpace: style.whiteSpace,
              clientWidth: element.clientWidth,
              scrollWidth: element.scrollWidth,
              clientHeight: element.clientHeight,
              scrollHeight: element.scrollHeight,
            };
          });
          const posterState = {
            source: poster.currentSrc,
            opacity: imageStyle.opacity,
            objectFit: imageStyle.objectFit,
            animationName: imageStyle.animationName,
            animationDuration: imageStyle.animationDuration,
            filter: imageStyle.filter,
            transform: imageStyle.transform,
          };
          const veilState = {
            background: veilStyle.backgroundColor,
            opacity: veilStyle.opacity,
            filter: veilStyle.filter,
          };
          const protectedElements = [
            ...scene.querySelectorAll(
              '.hero-info-bar, .hero-quote-title, .hero-quote-subtitle, .hero-title-letter',
            ),
            ...scene.querySelectorAll('.hero-photo, .hero-seal'),
          ];
          const protectedUnderBar = actionBounds
            ? protectedElements.some((element) => {
                const elementBounds = element.matches('.hero-photo')
                  ? clippedRect(element)
                  : rect(element);
                if (!elementBounds || getComputedStyle(element).display === 'none') return false;
                return elementBounds.bottom > actionBounds.top &&
                  elementBounds.top < actionBounds.bottom &&
                  elementBounds.right > actionBounds.left &&
                  elementBounds.left < actionBounds.right;
              })
            : false;

          return {
            air: computedAir,
            gaps: {
              infoQuote: quoteRect && rect(info) ? quoteRect.top - rect(info).bottom : null,
              quoteSubtitle: quoteRect && subtitleRect ? subtitleRect.top - quoteRect.bottom : null,
              subtitleTitle: subtitleRect && titleRect ? titleRect.top - subtitleRect.bottom : null,
              titleActionBar: titleRect && actionBounds ? actionBounds.top - titleRect.bottom : null,
              photoPhoto: photoPairs.length ? Math.min(...photoPairs.map((pair) => pair.gap)) : null,
              photoTextInfo: photoTextGaps.length ? Math.min(...photoTextGaps) : null,
              sealPhoto: otherPhotoGaps.length ? Math.min(...otherPhotoGaps) : null,
              sealText: sealTextGaps.length ? Math.min(...sealTextGaps) : null,
            },
            quoteLines,
            textBlocks,
            allTitleLettersInside,
            photos,
            photoPairs,
            titleRects,
            infoRect: rect(info),
            quoteRect,
            subtitleRect,
            titleRect,
            sealRect: rect(seal),
            actionRect: actionBounds,
            trackBottom: trackBounds ? trackBounds.bottom + scrollY : null,
            nextTop: nextBounds ? nextBounds.top + scrollY : null,
            scrollWidth: document.documentElement.scrollWidth,
            protectedUnderBar,
            poster: posterState,
            veil: veilState,
            titleFontSize: getComputedStyle(title).fontSize,
            quoteFontSize: getComputedStyle(quote).fontSize,
          };
        });

        if ('error' in state) {
          failures.push(`${width}x${height} @ ${progress}%: ${state.error}`);
          break;
        }

        const mobile = width < 768;
        const air = state.air;
        const minimumPhotoGap = mobile ? 8 : 32;
        const check = (name, value, minimum, maximum = Infinity) => {
          if (value !== null && (value < minimum - 1 || value > maximum + 1)) {
            failures.push(
              `${width}x${height} @ ${progress}%: ${name}=${rounded(value)}px, attendu ${rounded(minimum)}–${rounded(maximum)}px`,
            );
          }
        };
        check('bandeau↔citation', state.gaps.infoQuote, air * 2);
        check('citation↔sous-titre', state.gaps.quoteSubtitle, air, air * 2);
        check('sous-titre↔KLB', state.gaps.subtitleTitle, air * 3);
        check('KLB↔barre', state.gaps.titleActionBar, air * 2);
        check('photo↔photo', state.gaps.photoPhoto, minimumPhotoGap);
        check('photo↔texte/bandeau', state.gaps.photoTextInfo, 24);
        check('sceau↔photo', state.gaps.sealPhoto, 16);
        check('sceau↔texte', state.gaps.sealText, 24);

        if (state.scrollWidth > width) failures.push(`${width}x${height} @ ${progress}%: débordement horizontal.`);
        if (state.trackBottom !== null && state.nextTop !== null &&
            Math.abs(state.trackBottom - state.nextTop) > 1) {
          failures.push(`${width}x${height}: section suivante décalée de ${rounded(state.nextTop - state.trackBottom)}px.`);
        }
        if (!state.allTitleLettersInside) failures.push(`${width}x${height} @ ${progress}%: KLB coupé ou hors scène.`);
        if (state.quoteLines.length !== 2) failures.push(`${width}x${height} @ ${progress}%: la citation n’a pas exactement deux lignes.`);
        for (const line of state.quoteLines) {
          if (line.whiteSpace !== 'nowrap' || line.scrollWidth > line.clientWidth + 1 ||
              line.scrollHeight > line.clientHeight + 1) {
            failures.push(`${width}x${height} @ ${progress}%: ligne de citation coupée (« ${line.text} »).`);
          }
        }
        for (const item of state.textBlocks) {
          if (item.overflow === 'ellipsis' ||
              (item.clamp !== 'none' && item.clamp !== '0') ||
              item.scrollHeight > item.clientHeight + 1) {
            failures.push(`${width}x${height} @ ${progress}%: texte tronqué (« ${item.text} »).`);
          }
        }
        if (state.protectedUnderBar) failures.push(`${width}x${height} @ ${progress}%: contenu sous la barre flottante.`);
        if (state.poster.opacity !== '1' || state.poster.objectFit !== 'cover' ||
            state.poster.animationName !== 'hero-background-zoom' ||
            state.poster.animationDuration !== '40s' || state.poster.filter !== 'none') {
          failures.push(`${width}x${height} @ ${progress}%: styles du poster ont changé.`);
        }
        if (state.veil.background !== 'rgba(10, 8, 6, 0.6)' ||
            state.veil.opacity !== '1' || state.veil.filter !== 'none') {
          failures.push(`${width}x${height} @ ${progress}%: styles du voile ont changé.`);
        }

        report.push({
          viewport: `${width}x${height}`,
          progress,
          air: rounded(air),
          gaps: Object.fromEntries(
            Object.entries(state.gaps).map(([name, value]) => [name, rounded(value)]),
          ),
          titleFontSize: state.titleFontSize,
          quoteFontSize: state.quoteFontSize,
        });
      }

      await page.evaluate((top) => window.scrollTo(0, top), trackTop);
      await page.waitForTimeout(160);
      await page.evaluate(({ spacing }) => {
        const scene = document.querySelector('.home-hero');
        if (!scene) return;
        const canvas = document.createElement('canvas');
        canvas.className = 'hero-spacing-grid-overlay';
        canvas.width = window.innerWidth * devicePixelRatio;
        canvas.height = window.innerHeight * devicePixelRatio;
        Object.assign(canvas.style, {
          position: 'fixed',
          inset: '0',
          zIndex: '9998',
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
        });
        const context = canvas.getContext('2d');
        if (!context) return;
        context.scale(devicePixelRatio, devicePixelRatio);
        context.strokeStyle = 'rgba(255,255,255,0.12)';
        context.lineWidth = 0.5;
        for (let x = 0; x < innerWidth; x += spacing) {
          context.beginPath();
          context.moveTo(x, 0);
          context.lineTo(x, innerHeight);
          context.stroke();
        }
        for (let y = 0; y < innerHeight; y += spacing) {
          context.beginPath();
          context.moveTo(0, y);
          context.lineTo(innerWidth, y);
          context.stroke();
        }
        const labels = [
          ['.hero-info-bar', 'INFO'],
          ['.hero-quote-title', 'CITATION'],
          ['.hero-quote-subtitle:not(.hero-quote-subtitle--compact)', 'SOUS-TITRE'],
          ['.hero-photo', 'PHOTO'],
          ['.hero-seal', 'SCEAU'],
          ['.hero-title-klb', 'KLB'],
          ['[data-actionbar]', 'BARRE'],
        ];
        for (const [selector, label] of labels) {
          for (const element of document.querySelectorAll(selector)) {
            if (getComputedStyle(element).display === 'none') continue;
            const bounds = element.getBoundingClientRect();
            if (!bounds.width || !bounds.height) continue;
            context.strokeStyle = 'rgba(255,211,107,0.95)';
            context.lineWidth = 1;
            context.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            context.fillStyle = '#ffd36b';
            context.font = '12px sans-serif';
            context.fillText(label, bounds.x + 2, Math.max(12, bounds.y - 3));
          }
        }
        const info = document.querySelector('.hero-info-bar')?.getBoundingClientRect();
        const quote = document.querySelector('.hero-quote-title')?.getBoundingClientRect();
        const subtitle = Array.from(document.querySelectorAll('.hero-quote-subtitle')).find(
          (element) => getComputedStyle(element).display !== 'none',
        )?.getBoundingClientRect();
        const klb = document.querySelector('.hero-title-klb')?.getBoundingClientRect();
        const bar = document.querySelector('[data-actionbar]')?.getBoundingClientRect();
        const distances = [
          info && quote ? ['INFO↔CITATION', quote.top - info.bottom, (info.right + quote.left) / 2] : null,
          quote && subtitle ? ['CITATION↔SOUS-TITRE', subtitle.top - quote.bottom, (quote.left + subtitle.left) / 2] : null,
          subtitle && klb ? ['SOUS-TITRE↔KLB', klb.top - subtitle.bottom, (subtitle.left + klb.left) / 2] : null,
          klb && bar ? ['KLB↔BARRE', bar.top - klb.bottom, (klb.left + bar.left) / 2] : null,
        ].filter(Boolean);
        context.fillStyle = '#ffffff';
        context.font = '12px sans-serif';
        distances.forEach(([label, distance, x], index) => {
          context.fillText(`${label}: ${Math.round(distance)}px`, Math.max(4, x), 18 + index * 16);
        });
        document.body.appendChild(canvas);
      }, { spacing: Number.parseFloat(await page.locator('.home-hero').evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--air'),
      )) });
      await page.screenshot({
        path: path.join(outputDirectory, `hero-grid-${width}x${height}.png`),
        fullPage: false,
        animations: 'disabled',
      });
      await page.locator('.hero-spacing-grid-overlay').evaluate((element) => element.remove());
    }

    await fs.writeFile(
      path.join(outputDirectory, 'spacing-report.json'),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.table(
      report.map((row) => ({
        viewport: row.viewport,
        scroll: `${row.progress}%`,
        'air px': row.air,
        'info↔quote': row.gaps.infoQuote,
        'quote↔sub': row.gaps.quoteSubtitle,
        'sub↔KLB': row.gaps.subtitleTitle,
        'KLB↔bar': row.gaps.titleActionBar,
        'photo↔photo': row.gaps.photoPhoto,
        'photo↔text': row.gaps.photoTextInfo,
        'seal↔photo': row.gaps.sealPhoto,
        'seal↔text': row.gaps.sealText,
      })),
    );
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error('Échecs du test de respiration du hero :\n' + failures.join('\n'));
  process.exitCode = 1;
} else if (!backgroundCapture) {
  console.log(
    `Espacements validés : ${viewports.length} tailles × ${progressPoints.length} positions. Captures quadrillées et spacing-report.json dans ${outputDirectory}.`,
  );
}
