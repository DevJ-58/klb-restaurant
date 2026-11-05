import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { homeSectionById } from '../../data/sections';
import { prefersReducedMotion } from '../../lib/motion';
import { useIntro } from '../loader/Loader';
import { Hero } from './Hero';
import { Appetite } from './Appetite';
import { Steam } from '../effects/Steam';

gsap.registerPlugin(ScrollTrigger);

export function HeroStage() {
  const stageRef = useRef<HTMLElement>(null);
  const [steamTarget, setSteamTarget] = useState<HTMLElement | null>(null);
  const { introDone } = useIntro();

  useEffect(() => {
    setSteamTarget(stageRef.current?.querySelector<HTMLElement>('.hero-art-pointer') ?? null);
  }, []);

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage || !introDone || prefersReducedMotion()) {
        return;
      }

      const mask = stage.querySelector<HTMLElement>('.hero-mask-zoom');
      const outline = stage.querySelector<SVGElement>('.hero-mask-outline');
      const copy = stage.querySelector<HTMLElement>('.hero-copy');
      const status = stage.querySelector<HTMLElement>('.hero-open-status');
      const indicator = stage.querySelector<HTMLElement>('.hero-scroll-indicator');
      const cornerDish = stage.querySelector<HTMLElement>('.hero-corner-dish');
      const photo = stage.querySelector<HTMLElement>('.hero-mask-float');
      const backdrop = stage.querySelector<HTMLElement>('.hero-backdrop');
      const veil = stage.querySelector<HTMLElement>('.hero-veil');
      if (!mask || !outline || !copy || !status || !indicator || !photo || !backdrop || !veil) {
        return;
      }

      const zoomToCenter = (): { scale: number; x: number; y: number } => {
        const bounds = mask.getBoundingClientRect();
        return {
          scale:
            Math.max(window.innerWidth / mask.offsetWidth, window.innerHeight / mask.offsetHeight) *
            1.25,
          x: window.innerWidth / 2 - (bounds.left + bounds.width / 2),
          y: window.innerHeight / 2 - (bounds.top + bounds.height / 2),
        };
      };

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: () => `+=${window.innerHeight}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      timeline.to(
        mask,
        {
          scale: () => zoomToCenter().scale,
          x: () => zoomToCenter().x,
          y: () => zoomToCenter().y,
          duration: 0.8,
          ease: 'power2.inOut',
        },
        0,
      );
      timeline.to(copy, { yPercent: -25, opacity: 0, duration: 0.25, ease: 'none' }, 0);
      timeline.to(
        [status, indicator, ...(cornerDish ? [cornerDish] : [])],
        { opacity: 0, duration: 0.2, ease: 'none' },
        0,
      );
      timeline.to(outline, { opacity: 0, duration: 0.2, ease: 'none' }, 0.3);
      timeline.to(veil, { opacity: 0.86, duration: 0.7, ease: 'none' }, 0.25);
      timeline.to(photo, { opacity: 0, duration: 0.3, ease: 'none' }, 0.55);
      timeline.to(backdrop, { opacity: 1, duration: 0.3, ease: 'none' }, 0.55);
      timeline.to({}, { duration: 0.05 }, 0.95);

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    },
    { scope: stageRef, dependencies: [introDone], revertOnUpdate: true },
  );

  return (
    <section
      id="stage"
      className="home-hero-stage"
      ref={stageRef}
      data-bg-end={homeSectionById.hero.bgEnd}
      data-theme="dark"
      style={{ backgroundColor: homeSectionById.hero.bgEnd }}
      aria-label="KLB Restaurant"
    >
      <div className="stage-sticky">
        <Hero />
      </div>
      <div className="stage-content">
        <Appetite />
      </div>
      {steamTarget ? createPortal(<Steam />, steamTarget) : null}
    </section>
  );
}
