import { useRef, useState, type KeyboardEvent } from 'react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ambiancePhotos } from '../../data/homeAmbiance';
import { homeSectionById } from '../../data/sections';
import { useReveal } from '../../lib/useReveal';
import { SectionShell } from '../layout/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';

gsap.registerPlugin(Draggable, InertiaPlugin, ScrollTrigger);

function activeIndexForPosition(position: number, step: number, lastIndex: number): number {
  return Math.min(lastIndex, Math.max(0, Math.round(Math.abs(position) / step)));
}

function AmbiancePhoto({ src, alt, label }: { src: string; alt: string; label: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="ambiance-photo-arch">
      {(!loaded || failed) && (
        <div className="ambiance-photo-fallback" aria-hidden="true">
          <Camera size={40} strokeWidth={1.2} />
        </div>
      )}
      {!failed && (
        <img
          className={loaded ? 'ambiance-photo-loaded' : 'ambiance-photo-pending'}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

export function Ambiance() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<Draggable | null>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const photos = ambiancePhotos.filter((photo) => photo.available);
  const lastIndex = photos.length - 1;
  useReveal(sectionRef, { selector: '.ambiance-card', stagger: 0.1 });

  const stepSize = (): number => {
    const track = trackRef.current;
    if (!track?.firstElementChild) {
      return 1;
    }
    const card = track.firstElementChild as HTMLElement;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  };

  const moveTo = (nextIndex: number): void => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) {
      return;
    }

    const index = Math.max(0, Math.min(lastIndex, nextIndex));
    setActiveIndex(index);
    const distance = Math.min(index * stepSize(), Math.max(0, track.scrollWidth - viewport.clientWidth));

    if (draggableRef.current) {
      animationRef.current?.kill();
      animationRef.current = gsap.to(track, { x: -distance, duration: 0.7, ease: 'power4.out' });
      return;
    }

    viewport.scrollTo({ left: distance, behavior: 'smooth' });
  };

  useGSAP(
    () => {
      const section = sectionRef.current;
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!section || !viewport || !track) {
        return;
      }

      const media = gsap.matchMedia(section);
      media.add(
        '(min-width: 768px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
        () => {
          const [draggable] = Draggable.create(track, {
            type: 'x',
            bounds: viewport,
            edgeResistance: 0.85,
            inertia: true,
            onDragStart: () => document.body.classList.add('ambiance-dragging'),
            onDrag: () => {
              const step = stepSize();
              const x = Number(gsap.getProperty(track, 'x'));
              setActiveIndex(activeIndexForPosition(x, step, lastIndex));
            },
            onDragEnd: () => {
              document.body.classList.remove('ambiance-dragging');
              const step = stepSize();
              const x = Number(gsap.getProperty(track, 'x'));
              setActiveIndex(activeIndexForPosition(x, step, lastIndex));
            },
          });
          draggableRef.current = draggable;
          return () => {
            draggable.kill();
            if (draggableRef.current === draggable) {
              draggableRef.current = null;
            }
            document.body.classList.remove('ambiance-dragging');
          };
        },
      );

      const onScroll = (): void => {
        if (draggableRef.current) {
          return;
        }
        const step = stepSize();
        setActiveIndex(Math.min(lastIndex, Math.round(viewport.scrollLeft / step)));
      };
      viewport.addEventListener('scroll', onScroll, { passive: true });

      return () => {
        viewport.removeEventListener('scroll', onScroll);
        media.revert();
        animationRef.current?.kill();
        animationRef.current = null;
        document.body.classList.remove('ambiance-dragging');
      };
    },
    { scope: sectionRef },
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.target !== event.currentTarget) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveTo(activeIndex - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveTo(activeIndex + 1);
    }
  };

  return (
    <SectionShell
      className="ambiance-section"
      ref={sectionRef}
      aria-labelledby="ambiance-title"
      bgStart={homeSectionById.ambiance.bgStart}
      bgEnd={homeSectionById.ambiance.bgEnd}
      seam={homeSectionById.ambiance.seam}
      prevBg={homeSectionById.chiffres.bgEnd}
    >
      <div className="ambiance-header">
        <SectionTitle id="ambiance-title">L’ambiance KLB</SectionTitle>
        <div className="ambiance-controls">
          <button
            type="button"
            className="ambiance-control"
            aria-label="Photo précédente"
            disabled={activeIndex === 0}
            data-content
            onClick={() => moveTo(activeIndex - 1)}
          >
            <ChevronLeft aria-hidden="true" size={22} />
          </button>
          <button
            type="button"
            className="ambiance-control"
            aria-label="Photo suivante"
            disabled={activeIndex === lastIndex}
            data-content
            onClick={() => moveTo(activeIndex + 1)}
          >
            <ChevronRight aria-hidden="true" size={22} />
          </button>
        </div>
      </div>
      <div
        className="ambiance-viewport"
        ref={viewportRef}
        role="region"
        aria-label="Galerie photos de l’ambiance"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="ambiance-track" ref={trackRef} data-cursor="Glissez">
          {photos.map((photo) => (
            <figure className="ambiance-card" key={photo.id} data-content>
              <AmbiancePhoto src={photo.src} alt={photo.alt} label={photo.label} />
              <figcaption data-content>{photo.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
