import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { getOpenStatus } from '../../lib/hours';
import { getWebpVariant } from '../../lib/images';
import { heroBackground, heroSubtitle } from '../../data/hero';
import { site } from '../../config/site';
import { TransitionLink } from '../transition/TransitionLink';
import { Section } from '../Section';

const photos = [
  { className: 'hero-photo--arch', src: '/images/ambiance-salle-01.jpg' },
  { className: 'hero-photo--circle', src: '/images/equipe/cuisine-flamme.jpg' },
  { className: 'hero-photo--rectangle', src: '/images/ambiance-comptoir.jpg' },
] as const;

function BellFallback() {
  return (
    <span className="hero-photo-fallback">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M10 31c0-12 6-20 14-20s14 8 14 20M7 33h34M20 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    </span>
  );
}

function HeroPhoto({ className, src }: { className: string; src: string }) {
  const [unavailable, setUnavailable] = useState(!getWebpVariant(src, 640));
  const optimizedSource = getWebpVariant(src, 640);

  return (
    <div className={`hero-photo ${className}`} aria-hidden="true">
      {unavailable || !optimizedSource ? (
        <BellFallback />
      ) : (
        <img
          className="hero-photo-image"
          src={optimizedSource}
          alt=""
          width="640"
          height="800"
          loading="eager"
          decoding="async"
          onError={() => setUnavailable(true)}
        />
      )}
    </div>
  );
}

function HeroSeal() {
  return (
    <TransitionLink
      className="hero-seal"
      to="/carte"
      aria-label="Voir la carte"
      data-magnetic
    >
      <svg className="hero-seal-ring" viewBox="0 0 150 150" aria-hidden="true">
        <defs>
          <path
            id="hero-seal-circle"
            d="M75 75m-58 0a58 58 0 1 1 116 0a58 58 0 1 1-116 0"
          />
        </defs>
        <text>
          <textPath href="#hero-seal-circle">Voir la carte · Voir la carte · </textPath>
        </text>
      </svg>
      <ArrowUpRight className="hero-seal-arrow" aria-hidden="true" size={34} strokeWidth={1.8} />
    </TransitionLink>
  );
}

export function Hero() {
  const [openStatus, setOpenStatus] = useState(getOpenStatus);
  const [backgroundReady, setBackgroundReady] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateStatus = (): void => setOpenStatus(getOpenStatus());
    const interval = window.setInterval(updateStatus, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const actionBar = document.querySelector<HTMLElement>('[data-actionbar]');
    const header = document.querySelector<HTMLElement>('header');
    const updateActionBarHeight = (): void => {
      section.style.setProperty(
        '--hero-actionbar-height',
        `${actionBar?.getBoundingClientRect().height ?? 48}px`,
      );
      section.style.setProperty(
        '--hero-header-height',
        `${header?.getBoundingClientRect().height ?? 88}px`,
      );
    };

    const observer = new ResizeObserver(updateActionBarHeight);
    if (actionBar) observer.observe(actionBar);
    if (header) observer.observe(header);
    window.addEventListener('resize', updateActionBarHeight);
    updateActionBarHeight();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateActionBarHeight);
    };
  }, []);

  return (
    <Section
      className="home-hero"
      ref={sectionRef}
      data-surface="dark"
      aria-labelledby="home-hero-title"
    >
      <div className="home-hero-media" aria-hidden="true">
        <div className="home-hero-media-visual">
          <picture>
            <source
              media="(max-width: 767px)"
              srcSet={heroBackground.mobile}
              type="image/webp"
            />
            <img
              className={`home-hero-poster${backgroundReady ? ' is-ready' : ''}`}
              src={heroBackground.desktop}
              alt=""
              fetchPriority="high"
              decoding="async"
              onLoad={() => setBackgroundReady(true)}
              onError={(event) => {
                if (event.currentTarget.src.endsWith(heroBackground.fallback)) return;
                event.currentTarget.parentElement?.querySelector('source')?.removeAttribute('srcset');
                event.currentTarget.src = heroBackground.fallback;
              }}
            />
          </picture>
        </div>
      </div>
      <div className="home-hero-veil" aria-hidden="true" />

      <div className="hero-info-bar" aria-label="Informations du restaurant">
        <span className="hero-info-item">Restaurant et cafétéria</span>
        <span className="hero-info-rule" aria-hidden="true" />
        <span className="hero-info-item">{site.neighborhood}, {site.city}</span>
        <span className="hero-info-rule" aria-hidden="true" />
        <span className="hero-info-item hero-info-status" aria-live="polite">
          <span className={`hero-status-dot${openStatus.isOpen ? ' is-open' : ''}`} aria-hidden="true" />
          <span className="hero-status-label">{openStatus.isOpen ? 'Ouvert maintenant' : 'Fermé'}</span>
          <span className="hero-info-hours">{openStatus.message}</span>
        </span>
      </div>

      <div className="hero-copy-stack">
        <div className="hero-quote">
        <h2 className="hero-quote-title" aria-label="Bonne cuisine, bonne ambiance.">
          <span className="hero-quote-mask"><span>Bonne cuisine,</span></span>
          <span className="hero-quote-mask hero-quote-changing">
            <span className="hero-quote-current">bonne ambiance.</span>
            <span className="hero-quote-next">Venez comme vous êtes.</span>
          </span>
        </h2>
        </div>
        <p className="hero-quote-subtitle">{heroSubtitle}</p>
        <p className="hero-quote-subtitle hero-quote-subtitle--compact">
          Restaurant et cafétéria à Morofé, Yamoussoukro.
        </p>
      </div>

      <div className="hero-photo-stage" aria-hidden="true">
        <div className="hero-photo-canvas">
          {photos.map((photo) => (
            <HeroPhoto key={photo.className} className={photo.className} src={photo.src} />
          ))}
        </div>
        <HeroSeal />
      </div>

      <div className="hero-title-group">
        <h1 className="hero-title" id="home-hero-title" aria-label="KLB Restaurant">
          <span className="hero-title-klb" aria-hidden="true">
            {'KLB'.split('').map((letter, index) => (
              <span className="hero-title-letter-mask" key={`${letter}-${index}`}>
                <span className="hero-title-letter">{letter}</span>
              </span>
            ))}
          </span>
          <span className="hero-title-restaurant" aria-hidden="true">Restaurant</span>
        </h1>
      </div>

      <div className="hero-exit-cover" aria-hidden="true" />
    </Section>
  );
}
