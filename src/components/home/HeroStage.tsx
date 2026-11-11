import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { homeSectionById } from '../../data/sections';
import { prefersReducedMotion } from '../../lib/motion';
import { useIntro } from '../loader/Loader';
import { Hero } from './Hero';
import { Appetite } from './Appetite';

gsap.registerPlugin(ScrollTrigger);

export function HeroStage() {
  const stageRef = useRef<HTMLElement>(null);
  const { introDone, setIntroDone } = useIntro();

  useEffect(() => {
    if (!introDone && !document.getElementById('klb-preloader')) {
      setIntroDone(true);
    }
  }, [introDone, setIntroDone]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let timer = 0;
    const refresh = (): void => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    };
    const observer = new ResizeObserver(refresh);
    observer.observe(stage);
    window.addEventListener('resize', refresh, { passive: true });

    const images = Array.from(stage.querySelectorAll('img'));
    for (const image of images) {
      if (image.complete) continue;
      image.addEventListener('load', refresh, { once: true });
      image.addEventListener('error', refresh, { once: true });
    }
    void document.fonts.ready.then(refresh);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', refresh);
      for (const image of images) {
        image.removeEventListener('load', refresh);
        image.removeEventListener('error', refresh);
      }
    };
  }, []);

  useGSAP(
    () => {
      const stage = stageRef.current;
      if (!stage) return;

      const scene = stage.querySelector<HTMLElement>('.home-hero');
      const track = stage.querySelector<HTMLElement>('.stage-scroll-track');
      const mediaVisual = stage.querySelector<HTMLElement>('.home-hero-media-visual');
      const infoRules = stage.querySelectorAll<HTMLElement>('.hero-info-rule');
      const infoText = stage.querySelectorAll<HTMLElement>('.hero-info-item');
      const titleLetters = stage.querySelectorAll<HTMLElement>('.hero-title-letter');
      const photos = Array.from(stage.querySelectorAll<HTMLElement>('.hero-photo'));
      const photoStage = stage.querySelector<HTMLElement>('.hero-photo-stage');
      const photoImages = stage.querySelectorAll<HTMLElement>('.hero-photo-image');
      const quoteLines = stage.querySelectorAll<HTMLElement>('.hero-quote-mask > span');
      const quoteSubtitle = stage.querySelector<HTMLElement>('.hero-quote-subtitle');
      const seal = stage.querySelector<HTMLElement>('.hero-seal');
      const sealRing = stage.querySelector<HTMLElement>('.hero-seal-ring');
      const title = stage.querySelector<HTMLElement>('.hero-title');
      const currentQuote = stage.querySelector<HTMLElement>('.hero-quote-current');
      const nextQuote = stage.querySelector<HTMLElement>('.hero-quote-next');
      const exitCover = stage.querySelector<HTMLElement>('.hero-exit-cover');

      if (!scene || !track || !mediaVisual || !title || !photoStage || !exitCover) return;

      if (prefersReducedMotion()) {
        gsap.set(
          [
            ...infoRules,
            ...infoText,
            ...titleLetters,
            ...photos,
            ...quoteLines,
            quoteSubtitle,
            seal,
          ],
          { clearProps: 'all' },
        );
        gsap.set([currentQuote, nextQuote], { clearProps: 'all' });
        return;
      }

      const entry = gsap.timeline();
      entry.fromTo(
        infoRules,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.35, stagger: 0.06, ease: 'power2.out', transformOrigin: 'left center' },
      );
      entry.fromTo(
        infoText,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power2.out' },
        0.2,
      );
      entry.fromTo(
        titleLetters,
        { yPercent: 110, skewX: 6 },
        { yPercent: 0, skewX: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' },
        0.35,
      );
      entry.fromTo(
        photos,
        {
          clipPath: (index) =>
            index === 0
              ? 'inset(100% 0 0 0)'
              : index === 1
                ? 'circle(0% at 50% 50%)'
                : 'inset(0 100% 0 0)',
        },
        {
          clipPath: (index) => (index === 1 ? 'circle(75% at 50% 50%)' : 'inset(0)'),
          duration: 0.75,
          stagger: 0.12,
          ease: 'power2.inOut',
        },
        0.55,
      );
      entry.fromTo(
        photoImages,
        { scale: 1.3 },
        { scale: 1, duration: 0.85, stagger: 0.12, ease: 'power2.out' },
        0.55,
      );
      entry.fromTo(
        quoteLines,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.65, stagger: 0.12, ease: 'power3.out' },
        0.75,
      );
      if (quoteSubtitle) {
        entry.fromTo(
          quoteSubtitle,
          { y: 8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
          1.1,
        );
      }
      if (seal) {
        entry.fromTo(
          seal,
          { scale: 0, rotation: -24 },
          { scale: 1, rotation: 0, duration: 0.8, ease: 'elastic.out(1, 0.48)' },
          1.05,
        );
      }
      const sealSpin = sealRing
        ? gsap.to(sealRing, {
            rotation: 360,
            duration: 24,
            ease: 'none',
            repeat: -1,
            paused: true,
            transformOrigin: '50% 50%',
          })
        : null;

      let isVisible = true;
      const updateContinuousMotion = (): void => {
        if (isVisible && !document.hidden) {
          sealSpin?.play();
          if (entry.progress() < 1) {
            entry.play();
          }
        } else {
          sealSpin?.pause();
          if (entry.progress() < 1) entry.pause();
        }
      };
      const visibilityObserver = new IntersectionObserver(([record]) => {
        isVisible = Boolean(record?.isIntersecting);
        updateContinuousMotion();
      });
      visibilityObserver.observe(scene);
      document.addEventListener('visibilitychange', updateContinuousMotion);
      entry.eventCallback('onComplete', () => {
        sealSpin?.play();
      });

      const scrollTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      scrollTimeline.fromTo(
        mediaVisual,
        { yPercent: -4 },
        { yPercent: 4, duration: 1, ease: 'none' },
        0,
      );
      const photoSide = (): number => Math.min(photoStage.clientWidth, photoStage.clientHeight);
      scrollTimeline.to(photos[0], { y: () => -photoSide() * 0.01, duration: 0.35, ease: 'none' }, 0);
      scrollTimeline.to(photos[1], { y: () => -photoSide() * 0.04, duration: 0.35, ease: 'none' }, 0);
      scrollTimeline.to(photos[2], { y: () => photoSide() * 0.01, duration: 0.35, ease: 'none' }, 0);
      if (currentQuote && nextQuote) {
        gsap.set(nextQuote, { yPercent: 110 });
        scrollTimeline.to(currentQuote, { yPercent: -110, duration: 0.22, ease: 'none' }, 0.13);
        scrollTimeline.to(nextQuote, { yPercent: 0, duration: 0.22, ease: 'none' }, 0.13);
      }
      scrollTimeline.to(photos[0], { y: () => -photoSide() * 0.02, duration: 0.35, ease: 'none' }, 0.35);
      scrollTimeline.to(photos[1], { y: () => -photoSide() * 0.07, duration: 0.35, ease: 'none' }, 0.35);
      scrollTimeline.to(photos[2], { y: () => photoSide() * 0.02, duration: 0.35, ease: 'none' }, 0.35);
      scrollTimeline.to(title, { scale: 0.82, y: () => -window.innerHeight * 0.08, duration: 0.35, ease: 'none' }, 0.35);
      scrollTimeline.to(scene.querySelector('.hero-quote'), { y: () => -window.innerHeight * 0.06, duration: 0.35, ease: 'none' }, 0.35);

      const centerOfSeal = (): { x: number; y: number } => {
        const sealBounds = seal?.getBoundingClientRect();
        const sceneBounds = scene.getBoundingClientRect();
        return {
          x: sealBounds ? sealBounds.left + sealBounds.width / 2 - sceneBounds.left : window.innerWidth / 2,
          y: sealBounds ? sealBounds.top + sealBounds.height / 2 - sceneBounds.top : window.innerHeight / 2,
        };
      };
      scrollTimeline.fromTo(
        exitCover,
        {
          clipPath: () => {
            const center = centerOfSeal();
            return `circle(0px at ${center.x}px ${center.y}px)`;
          },
        },
        {
          clipPath: () => {
            const center = centerOfSeal();
            return `circle(${Math.hypot(window.innerWidth, window.innerHeight)}px at ${center.x}px ${center.y}px)`;
          },
          duration: 0.3,
          ease: 'none',
        },
        0.7,
      );

      return () => {
        visibilityObserver.disconnect();
        document.removeEventListener('visibilitychange', updateContinuousMotion);
        scrollTimeline.scrollTrigger?.kill();
        scrollTimeline.kill();
        entry.kill();
        sealSpin?.kill();
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
      data-surface="dark"
      style={{ backgroundColor: homeSectionById.hero.bgEnd }}
      aria-label="KLB Restaurant"
    >
      <div className="stage-scroll-track">
        <div className="stage-sticky">
          <Hero />
        </div>
      </div>
      <div className="stage-content">
        <Appetite />
      </div>
    </section>
  );
}
