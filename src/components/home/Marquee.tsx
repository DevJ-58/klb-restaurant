import { useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TransitionLink } from '../transition/TransitionLink';
import { site } from '../../config/site';
import { homeSectionById } from '../../data/sections';
import { prefersReducedMotion } from '../../lib/motion';
import { useReveal } from '../../lib/useReveal';
import { SectionShell } from '../layout/SectionShell';

gsap.registerPlugin(ScrollTrigger);

const promisePhotos = [
  '/images/plats/plat-gambas.jpg',
  '/images/equipe/cuisine-flamme.jpg',
  '/images/ambiance/ambiance-comptoir.jpg',
];

export function Marquee() {
  const sectionRef = useRef<HTMLElement>(null);
  const firstTrackRef = useRef<HTMLDivElement>(null);
  const secondTrackRef = useRef<HTMLDivElement>(null);
  const [unavailablePhotos, setUnavailablePhotos] = useState<number[]>([]);

  useReveal(sectionRef, { selector: '.marquee-row', stagger: 0.1 });

  useGSAP(
    () => {
      const section = sectionRef.current;
      const firstTrack = firstTrackRef.current;
      const secondTrack = secondTrackRef.current;
      if (!section || !firstTrack || !secondTrack || prefersReducedMotion()) {
        return;
      }

      const media = gsap.matchMedia(section);
      media.add(
        { isMobile: '(max-width: 767px)', isDesktop: '(min-width: 768px)' },
        (context) => {
          const duration = context.conditions?.isMobile ? 28 : 40;
          const firstLoop = gsap.fromTo(
            firstTrack,
            { xPercent: 0 },
            { xPercent: -50, duration, ease: 'none', repeat: -1, paused: true },
          );
          const secondLoop = gsap.fromTo(
            secondTrack,
            { xPercent: -50 },
            { xPercent: 0, duration, ease: 'none', repeat: -1, paused: true },
          );
          const setScales = [firstLoop, secondLoop].map((loop) =>
            gsap.quickTo(loop, 'timeScale', { duration: 0.6, ease: 'power2.out' }),
          );
          let resetScale: gsap.core.Tween | null = null;
          const scrollTrigger = ScrollTrigger.create({
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: (self) => {
              if (self.isActive) {
                firstLoop.play();
                secondLoop.play();
              } else {
                firstLoop.pause();
                secondLoop.pause();
                setScales.forEach((setScale) => setScale(1));
              }
            },
            onUpdate: (self) => {
              const scale = Math.min(4, 1 + Math.abs(self.getVelocity()) / 400);
              setScales.forEach((setScale) => setScale(scale));
              resetScale?.kill();
              resetScale = gsap.delayedCall(0.12, () =>
                setScales.forEach((setScale) => setScale(1)),
              );
            },
          });

          const bounds = section.getBoundingClientRect();
          if (bounds.top < window.innerHeight && bounds.bottom > 0) {
            firstLoop.play();
            secondLoop.play();
          }

          return () => {
            resetScale?.kill();
            scrollTrigger.kill();
            firstLoop.kill();
            secondLoop.kill();
          };
        },
      );
      return () => media.revert();
    },
    { scope: sectionRef },
  );

  const renderGroup = (isDuplicate: boolean, italic: boolean) => (
    <div className="marquee-group" aria-hidden={isDuplicate || undefined}>
      {site.promises.map((promise, index) => (
        <div className="marquee-unit" key={`${italic ? 'italic-' : ''}${isDuplicate ? 'copy-' : ''}${promise}`}>
          <span className={`marquee-promise${italic ? ' marquee-promise--italic' : ''}`} data-content>
            {promise}
          </span>
          <span
            className={`marquee-photo${unavailablePhotos.includes(index) ? ' marquee-photo--empty' : ''}`}
            data-content
          >
            {!unavailablePhotos.includes(index) && (
              <img
                src={promisePhotos[index % promisePhotos.length]}
                alt=""
                aria-hidden="true"
                data-content
                onError={() =>
                  setUnavailablePhotos((current) =>
                    current.includes(index) ? current : [...current, index],
                  )
                }
              />
            )}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <SectionShell
      className="marquee-section"
      ref={sectionRef}
      aria-labelledby="marquee-title"
      data-theme="light"
      bgStart={homeSectionById.marquee.bgStart}
      bgEnd={homeSectionById.marquee.bgEnd}
      seam={homeSectionById.marquee.seam}
      prevBg={homeSectionById.ambiance.bgEnd}
    >
      <h2 className="visually-hidden" id="marquee-title" data-content>
        Nos trois promesses
      </h2>
      <div className="marquee-window">
        <div className="marquee-row marquee-row--first" data-content>
          <div className="marquee-track" ref={firstTrackRef}>
            {renderGroup(false, false)}
            {renderGroup(true, false)}
          </div>
        </div>
        <div className="marquee-button-gap">
          <TransitionLink className="marquee-button" to="/carte" data-content>
            <span>Voir la carte</span>
            <ArrowUpRight aria-hidden="true" size={20} />
          </TransitionLink>
        </div>
        <div className="marquee-row marquee-row--second" aria-hidden="true" data-content>
          <div className="marquee-track" ref={secondTrackRef}>
            {renderGroup(false, true)}
            {renderGroup(true, true)}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
