import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getOpenStatus } from '../../lib/hours';
import { prefersReducedMotion } from '../../lib/motion';
import { useIntro } from '../loader/Loader';
import { SmartImage } from '../SmartImage';
import { OptimizedImg } from '../OptimizedImg';
import { splitChars } from '../../lib/splitChars';
import { CornerDish } from '../ui/CornerDish';
import { placements } from '../../data/featured';
import { Section } from '../Section';
import { homeSectionById } from '../../data/sections';

gsap.registerPlugin(ScrollTrigger);

const titleLines = ['Bonne', 'cuisine,', 'bonne', 'ambiance.'];
const title = titleLines.join(' ');
const maskPath =
  'M0.52,0.02 C0.74,0.0 0.95,0.12 0.98,0.34 C1.0,0.55 0.9,0.62 0.93,0.78 C0.96,0.93 0.78,1.0 0.58,0.99 C0.36,0.98 0.2,1.0 0.08,0.86 C0.0,0.72 0.06,0.55 0.03,0.38 C0.0,0.2 0.3,0.04 0.52,0.02 Z';
const outlinePath =
  'M52 2 C74 0 95 12 98 34 C100 55 90 62 93 78 C96 93 78 100 58 99 C36 98 20 100 8 86 C0 72 6 55 3 38 C0 20 30 4 52 2 Z';

export function Hero() {
  const { introDone } = useIntro();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleCharsRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<SVGPathElement>(null);
  const [openStatus, setOpenStatus] = useState(getOpenStatus);

  useEffect(() => {
    const updateStatus = (): void => setOpenStatus(getOpenStatus());
    const interval = window.setInterval(updateStatus, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useGSAP(
    (_context, contextSafe) => {
      if (!introDone || !sectionRef.current) {
        return;
      }
      if (!contextSafe) {
        throw new Error('Le contexte GSAP du hero est indisponible.');
      }

      const section = sectionRef.current;
      let cleanupMotion = (): void => {};
      let indicatorDismissed = false;
      const dismissIndicator = contextSafe(() => {
        if (indicatorDismissed) {
          return;
        }
        indicatorDismissed = true;
        gsap.to(indicatorRef.current, { opacity: 0, duration: 0.2 });
      });
      window.addEventListener('scroll', dismissIndicator, { once: true, passive: true });
      const titleChars = titleCharsRef.current?.querySelectorAll<HTMLElement>('.hero-char');
      const outline = outlineRef.current;
      const pathLength = outline?.getTotalLength() ?? 0;

      if (prefersReducedMotion()) {
        gsap.fromTo(
          [titleRef.current, artRef.current, subtitleRef.current, statusRef.current],
          { opacity: 0 },
          { opacity: 1, duration: 0.3, stagger: 0.05, ease: 'none' },
        );
        outline?.setAttribute('stroke-dashoffset', '0');
        return () => window.removeEventListener('scroll', dismissIndicator);
      }

      if (outline && pathLength > 0) {
        gsap.set(outline, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });
      }

      const startMotion = contextSafe(() => {
        if (!pointerRef.current || !floatRef.current) {
          return;
        }

        const floatAnimation = gsap.fromTo(
          floatRef.current,
          { y: -8 },
          { y: 8, duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true },
        );
        let resizeFrame = 0;
        const onResize = (): void => {
          window.cancelAnimationFrame(resizeFrame);
          resizeFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
        };
        window.addEventListener('resize', onResize, { passive: true });

        let resetPointer = (): void => {};
        const pointerMedia = window.matchMedia('(min-width: 768px) and (pointer: fine)');
        if (pointerMedia.matches) {
          const moveX = gsap.quickTo(pointerRef.current, 'x', {
            duration: 0.6,
            ease: 'power3.out',
          });
          const moveY = gsap.quickTo(pointerRef.current, 'y', {
            duration: 0.6,
            ease: 'power3.out',
          });
          const rotate = gsap.quickTo(pointerRef.current, 'rotation', {
            duration: 0.6,
            ease: 'power3.out',
          });
          const onPointerMove = contextSafe((event: PointerEvent): void => {
            const bounds = section.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 24;
            const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 24;
            moveX(x);
            moveY(y);
            rotate((x / 12) * 1.5);
          });
          const reset = contextSafe((): void => {
            moveX(0);
            moveY(0);
            rotate(0);
          });
          section.addEventListener('pointermove', onPointerMove);
          section.addEventListener('pointerleave', reset);
          resetPointer = () => {
            section.removeEventListener('pointermove', onPointerMove);
            section.removeEventListener('pointerleave', reset);
          };
        }

        cleanupMotion = () => {
          resetPointer();
          window.removeEventListener('scroll', dismissIndicator);
          window.removeEventListener('resize', onResize);
          window.cancelAnimationFrame(resizeFrame);
          floatAnimation.kill();
        };
        ScrollTrigger.refresh();
      });

      const entrance = gsap.timeline({ onComplete: startMotion });

      if (titleChars) {
        entrance.from(titleChars, {
          yPercent: 60,
          opacity: 0,
          rotation: -4,
          duration: 0.9,
          stagger: 0.02,
          ease: 'power4.out',
        });
      }
      entrance.fromTo(
        artRef.current,
        { scale: 0.6, rotation: -8, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 1.4, ease: 'power4.out' },
        0,
      );
      if (outline && pathLength > 0) {
        entrance.to(outline, { strokeDashoffset: 0, duration: 1, ease: 'power4.out' }, 1.4);
      }
      const copyRevealAt = 0.9 + Math.max((titleChars?.length ?? 1) - 1, 0) * 0.02;
      entrance.from(
        [subtitleRef.current, statusRef.current],
        { y: 24, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power4.out' },
        copyRevealAt,
      );
      gsap.fromTo(
        indicatorRef.current,
        { scaleY: 0.35, transformOrigin: 'top center' },
        { scaleY: 1, duration: 0.9, ease: 'power4.inOut', repeat: -1, yoyo: true },
      );

      return () => {
        entrance.kill();
        window.removeEventListener('scroll', dismissIndicator);
        cleanupMotion();
      };
    },
    { scope: sectionRef, dependencies: [introDone], revertOnUpdate: true },
  );

  const refreshAfterImageLoad = (): void => {
    ScrollTrigger.refresh();
  };

  return (
    <>
      <svg className="hero-clip-defs" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="hero-organic-clip" clipPathUnits="objectBoundingBox">
            <path d={maskPath} />
          </clipPath>
          <linearGradient id="hero-outline-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD36B" />
            <stop offset="48%" stopColor="#F5A912" />
            <stop offset="100%" stopColor="#C9800B" />
          </linearGradient>
        </defs>
      </svg>
      <Section
        className="home-hero"
        ref={sectionRef}
        data-theme="dark"
        aria-labelledby="home-hero-title"
        style={{ backgroundColor: homeSectionById.hero.bgStart }}
      >
        <div className="hero-backdrop" aria-hidden="true">
          <OptimizedImg
            src="/images/hero/hero-plat-signature.jpg"
            alt=""
            loading="eager"
            fetchPriority="high"
          />
        </div>
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="hero-content">
          <div className="hero-copy">
            <h1 className="hero-title" id="home-hero-title" aria-label={title} tabIndex={-1} ref={titleRef} data-content>
              <span className="hero-title-lines" ref={titleCharsRef} aria-hidden="true">
                {titleLines.map((line) => (
                  <span className="hero-title-line" key={line}>
                    {splitChars(line, 'hero-char')}
                  </span>
                ))}
              </span>
            </h1>
            <p className="hero-subtitle" ref={subtitleRef} data-content>
              Restaurant et cafétéria à Morofé, Yamoussoukro.
            </p>
            <div
              className={`hero-open-status${openStatus.isOpen ? ' hero-open-status--open' : ' hero-open-status--closed'}`}
              ref={statusRef}
              aria-live="polite"
              data-content
            >
              <span className="hero-open-status-dot" aria-hidden="true" />
              <span>{openStatus.isOpen ? 'Ouvert maintenant' : 'Fermé'}</span>
              <span className="hero-open-status-time">{openStatus.message}</span>
            </div>
          </div>

          <div className="hero-art" ref={artRef}>
            <div className="hero-art-pointer" ref={pointerRef}>
              <div className="hero-mask-zoom" ref={zoomRef}>
                <svg className="hero-mask-outline" viewBox="0 0 100 100" aria-hidden="true">
                  <path
                    ref={outlineRef}
                    d={outlinePath}
                    pathLength={1000}
                    stroke="url(#hero-outline-gradient)"
                    strokeWidth="0.5"
                    fill="none"
                    strokeDasharray="1000"
                    strokeDashoffset="1000"
                  />
                </svg>
                <div className="hero-mask-float" ref={floatRef} data-content="media">
                  <SmartImage
                    src="/images/hero/hero-plat-signature.jpg"
                    alt="Plat signature de KLB Restaurant"
                    aspectRatio="4 / 5"
                    className="hero-dish-image"
                    loading="eager"
                    fetchPriority="high"
                    onLoad={refreshAfterImageLoad}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-scroll-indicator" ref={indicatorRef} aria-hidden="true" data-content>
          <span>Défiler</span>
          <span className="hero-scroll-line" />
        </div>

        <div className="corner-dish-frame hero-corner-frame">
          {introDone && (
            <CornerDish
              itemId={placements.hero}
              corner="bottom-right"
              offset="calc(var(--action-bar-height) + 16px)"
              className="hero-corner-dish"
            />
          )}
        </div>
      </Section>
    </>
  );
}
