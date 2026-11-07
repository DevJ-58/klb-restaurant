import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { featured, getFeaturedBackgrounds } from '../../data/featured';
import { formatPrice, getItem, type MenuItem } from '../../data/menu';
import { cssColor } from '../../lib/theme-colors';
import { prefersReducedMotion } from '../../lib/motion';
import { scrollLenisTo } from '../../lib/lenis';
import { site } from '../../config/site';
import { TransitionLink } from '../transition/TransitionLink';
import { Plate } from '../ui/Plate';
import { Section } from '../Section';
import { homeSectionById } from '../../data/sections';

gsap.registerPlugin(ScrollTrigger);

function getMenuItem(itemId: (typeof featured)[number]): MenuItem {
  const item = getItem(itemId);
  if (!item) {
    throw new Error(`Plat vedette introuvable dans le menu : ${itemId}`);
  }
  return item;
}

const featuredItems = featured.map((itemId) => getMenuItem(itemId));

function setHeaderLock(locked: boolean): void {
  document.dispatchEvent(new CustomEvent<boolean>('klb:header-lock', { detail: locked }));
}

function getItemNote(item: MenuItem): string | undefined {
  return item.note ?? (item.tags?.includes('sur-commande') ? 'Sur commande' : undefined);
}

export function Incontournables() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const pinTriggerRef = useRef<ScrollTrigger | null>(null);
  const mediaRef = useRef<gsap.MatchMedia | null>(null);
  const focusFrameRef = useRef<number | null>(null);
  const backgrounds = getFeaturedBackgrounds();

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      const progress = progressRef.current;
      if (!section || !track || !progress || prefersReducedMotion()) {
        return;
      }

      const media = gsap.matchMedia();
      mediaRef.current = media;

      const getTravel = (): number => Math.max(0, track.scrollWidth - window.innerWidth);
      const setupTimeline = (): (() => void) => {
        const trackTween = gsap.fromTo(
          track,
          { x: 0 },
          { x: () => -getTravel(), duration: 1, ease: 'none' },
        );
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: () => `+=${getTravel()}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: (self) => {
              pinTriggerRef.current = self;
              setHeaderLock(self.isActive);
            },
            onToggle: (self) => setHeaderLock(self.isActive),
            onKill: () => {
              pinTriggerRef.current = null;
              setHeaderLock(false);
            },
            onLeave: () => {
              gsap.to(section.querySelector('.featured-curved-title'), {
                opacity: 0,
                duration: 0.6,
                ease: 'power1.out',
                overwrite: true,
              });
            },
            onEnterBack: () => {
              gsap.to(section.querySelector('.featured-curved-title'), {
                opacity: 1,
                duration: 0.6,
                ease: 'power1.out',
                overwrite: true,
              });
            },
          },
        });
        timeline.add(trackTween, 0);
        timeline.fromTo(
          progress,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 1,
            ease: 'none',
            onUpdate: () => {
              const progressBar = progress.parentElement;
              progressBar?.setAttribute('aria-valuenow', String(Math.round(timeline.progress() * 100)));
            },
          },
          0,
        );

        for (let index = 0; index < backgrounds.length - 1; index += 1) {
          const nextBackground = cssColor(backgrounds[index + 1]);
          if (nextBackground) {
            timeline.to(
              section,
              { backgroundColor: nextBackground, duration: 0.5 / 6, ease: 'none' },
              (index + 0.25) / 6,
            );
          }
        }

        const firstPlate = section.querySelector<HTMLElement>('.featured-panel--0 .plate-photo');
        if (firstPlate) {
          gsap.fromTo(
            firstPlate,
            { rotation: 20, scale: 1.1 },
            {
              rotation: 0,
              scale: 1,
              duration: 1,
              ease: 'power4.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                once: true,
              },
            },
          );
        }

        for (let index = 1; index < featuredItems.length; index += 1) {
          const panel = section.querySelector<HTMLElement>(`.featured-panel--${index}`);
          const photo = panel?.querySelector<HTMLElement>('.plate-photo');
          const details = panel?.querySelector<HTMLElement>('.featured-panel-details');
          if (!panel || !photo || !details) {
            continue;
          }

          gsap.fromTo(
            photo,
            { xPercent: 55, yPercent: 10, rotation: 28, scale: 1.2, opacity: 0 },
            {
              xPercent: 0,
              yPercent: 0,
              rotation: 0,
              scale: 1,
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: panel,
                containerAnimation: trackTween,
                start: 'left 92%',
                end: 'left 52%',
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            },
          );
          gsap.fromTo(
            details,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: panel,
                containerAnimation: trackTween,
                start: 'left 92%',
                end: 'left 52%',
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            },
          );
        }

        const finalPanel = section.querySelector<HTMLElement>('.featured-final-panel');
        if (finalPanel) {
          gsap.fromTo(
            finalPanel,
            { opacity: 0 },
            {
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: finalPanel,
                containerAnimation: trackTween,
                start: 'left 92%',
                end: 'left 52%',
                scrub: 0.6,
                invalidateOnRefresh: true,
              },
            },
          );
        }

        for (let index = 0; index < featuredItems.length; index += 1) {
          const panel = section.querySelector<HTMLElement>(`.featured-panel--${index}`);
          const photo = panel?.querySelector<HTMLElement>('.plate');
          const details = panel?.querySelector<HTMLElement>('.featured-panel-details');
          if (!panel || !photo || !details) {
            continue;
          }
          gsap.timeline({
            scrollTrigger: {
              trigger: panel,
              containerAnimation: trackTween,
              start: 'center 50%',
              end: 'center 15%',
              scrub: 0.6,
              invalidateOnRefresh: true,
            },
          })
            .to(details, { y: 24, opacity: 0.7, ease: 'none' }, 0)
            .to(photo, { scale: 0.94, ease: 'none' }, 0);
        }

        pinTriggerRef.current = timeline.scrollTrigger ?? null;
        return () => {
          pinTriggerRef.current = null;
        };
      };

      media.add('(min-width: 768px)', setupTimeline);
      media.add('(max-width: 767px)', setupTimeline);

      let refreshFrame = 0;
      let active = true;
      const refresh = (): void => {
        window.cancelAnimationFrame(refreshFrame);
        refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
      };
      window.addEventListener('resize', refresh, { passive: true });
      void document.fonts.ready.then(() => {
        if (active) {
          refresh();
        }
      });

      return () => {
        active = false;
        window.removeEventListener('resize', refresh);
        window.cancelAnimationFrame(refreshFrame);
        media.revert();
        mediaRef.current = null;
        pinTriggerRef.current = null;
        setHeaderLock(false);
      };
    },
    { scope: sectionRef, revertOnUpdate: true },
  );

  useEffect(
    () => () => {
      if (focusFrameRef.current !== null) {
        window.cancelAnimationFrame(focusFrameRef.current);
      }
      mediaRef.current?.revert();
    },
    [],
  );

  const focusPanel = (index: number): void => {
    if (prefersReducedMotion()) {
      return;
    }
    if (!sectionRef.current) {
      return;
    }
    const progress = index / 6;
    window.cancelAnimationFrame(focusFrameRef.current ?? 0);
    focusFrameRef.current = window.requestAnimationFrame(() => {
      focusFrameRef.current = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        const currentTrigger = pinTriggerRef.current;
        const section = sectionRef.current;
        if (!section) {
          return;
        }
        const pinSpacer = section.parentElement;
        let start = currentTrigger?.start ?? 0;
        let distance = currentTrigger ? currentTrigger.end - currentTrigger.start : 0;
        if (pinSpacer?.classList.contains('pin-spacer') && section) {
          start = pinSpacer.getBoundingClientRect().top + window.scrollY;
          distance = pinSpacer.clientHeight - section.offsetHeight;
        } else if (!currentTrigger) {
          return;
        }
        const target = start + distance * progress;
        scrollLenisTo(
          index === 6 ? Math.max(start, target - 1) : target,
          true,
        );
      });
    });
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const handleFocusIn = (event: FocusEvent): void => {
      if (!(event.target instanceof Element)) {
        return;
      }
      const panel = event.target.closest<HTMLElement>('.featured-panel');
      if (!panel) {
        return;
      }
      const index = Array.from(section.querySelectorAll('.featured-panel')).indexOf(panel);
      if (index >= 0) {
        focusPanel(index);
      }
    };

    section.addEventListener('focusin', handleFocusIn);
    return () => section.removeEventListener('focusin', handleFocusIn);
  }, []);

  return (
    <>
      <Section
        className={`featured-section${homeSectionById.incontournables.seam === 'dome' ? ' section-shell--dome' : ''}`}
        ref={sectionRef}
        aria-labelledby="featured-section-title"
        style={{ backgroundColor: cssColor(homeSectionById.incontournables.bgStart) }}
      >
        <h2 className="visually-hidden" id="featured-section-title" data-content>
          Les incontournables de KLB
        </h2>
        <svg
          className="featured-curved-title"
          viewBox="0 0 800 200"
          role="img"
          aria-label="Les incontournables de KLB"
          data-content
        >
          <defs>
            <path id="featured-title-arc" d="M 40 190 Q 400 -40 760 190" />
          </defs>
          <text>
            <textPath href="#featured-title-arc" startOffset="50%" textAnchor="middle">
              Les incontournables de KLB
            </textPath>
          </text>
        </svg>

        <div className="featured-track-window">
          <div className="featured-track" ref={trackRef}>
            {featuredItems.map((item, index) => (
              <article
                className={`featured-panel featured-panel--${index}`}
                key={item.id}
                aria-labelledby={`featured-item-${item.id}`}
                data-content
              >
                <Plate
                  item={item}
                  size="clamp(200px, min(26vw, 42svh), 400px)"
                  priority={index === 0}
                />
                <div className="featured-panel-details" data-content>
                  <h3 id={`featured-item-${item.id}`} data-content>{item.name}</h3>
                  {getItemNote(item) && <p data-content>{getItemNote(item)}</p>}
                  {item.price && <span className="featured-price" data-content>{formatPrice(item.price)}</span>}
                  <a
                    className="featured-order-link"
                    href={site.whatsappLink(item.name)}
                    target="_blank"
                    rel="noreferrer"
                    data-content
                  >
                    Commander
                  </a>
                </div>
              </article>
            ))}

            <article
              className="featured-panel featured-final-panel"
              aria-labelledby="featured-final-title"
              data-content
            >
              <TransitionLink className="featured-final-circle" to="/carte" data-content>
                <h3 id="featured-final-title" data-content>Voir toute la carte</h3>
                <ArrowRight aria-hidden="true" size={40} />
              </TransitionLink>
            </article>
          </div>
        </div>

        <div
          className="featured-progress"
          role="progressbar"
          aria-label="Progression des plats"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        >
          <span className="featured-progress-fill" ref={progressRef} />
        </div>
      </Section>
    </>
  );
}
