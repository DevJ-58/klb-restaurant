import { useEffect, useRef, useState, type ComponentType } from 'react';
import { ArrowRight, ChefHat, HeartHandshake, Smile, UtensilsCrossed } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { site } from '../../config/site';
import { prefersReducedMotion } from '../../lib/motion';
import { TransitionLink } from '../transition/TransitionLink';
import { SectionShell } from '../layout/SectionShell';
import { homeSectionById } from '../../data/sections';

gsap.registerPlugin(ScrollTrigger);

type PromiseItem = {
  image: string | null;
  imageAlt: string;
  Icon: ComponentType<LucideProps>;
  title: string;
  description: string;
};

const promises: PromiseItem[] = [
  {
    image: '/images/equipe/cuisine-dressage.jpg',
    imageAlt: 'Un plat soigneusement dressé dans la cuisine KLB',
    Icon: UtensilsCrossed,
    title: 'Cuisine de qualité',
    description: 'Des plats préparés avec soin, de la garniture au plat de résistance.',
  },
  {
    image: '/images/equipe/equipe-service.jpg',
    imageAlt: 'Un membre de l’équipe KLB au service',
    Icon: HeartHandshake,
    title: 'Service chaleureux',
    description: 'Une équipe qui vous accueille et vous conseille à chaque table.',
  },
  {
    image: null,
    imageAlt: 'La salle du restaurant KLB',
    Icon: Smile,
    title: 'Moment inoubliable',
    description: 'Un cadre agréable, des plats à partager, du matin au soir.',
  },
];

function formatOpeningHours(): string {
  const hours = Object.values(site.openingHours)[0];
  const format = (time: string): string => {
    const [hour, minute] = time.split(':');
    return `${Number(hour)} h ${minute}`;
  };
  return `${format(hours.opens)} à ${format(hours.closes)}`;
}

function PromiseDisc({ item, index }: { item: PromiseItem; index: number }) {
  const [unavailable, setUnavailable] = useState(item.image === null);
  const Icon = item.Icon;

  return (
    <div
      className="promise-disc reveal"
      data-content="media"
      role={unavailable ? 'img' : undefined}
      aria-label={unavailable ? item.imageAlt : undefined}
    >
      <div className={`promise-disc-photo${unavailable ? ' promise-disc-photo--fallback' : ''}`}>
        {unavailable || !item.image ? (
          <Icon aria-hidden="true" size={60} strokeWidth={1.2} />
        ) : (
          <img
            src={item.image}
            alt={item.imageAlt}
            onError={() => setUnavailable(true)}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        )}
      </div>
      <span className="promise-disc-ring" aria-hidden="true" />
    </div>
  );
}

function PromiseBadge() {
  return (
    <div className="promise-badge" aria-hidden="true">
      <svg viewBox="0 0 150 150">
        <defs>
          <path
            id="promise-badge-circle"
            d="M75,75 m-57,0 a57,57 0 1,1 114,0 a57,57 0 1,1 -114,0"
          />
        </defs>
        <text>
          <textPath href="#promise-badge-circle">
            KLB Restaurant • Bonne cuisine, bonne ambiance •
          </textPath>
        </text>
      </svg>
      <span className="promise-badge-center">
        <ChefHat size={27} strokeWidth={1.5} />
      </span>
    </div>
  );
}

export function Appetite() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    document.documentElement.classList.add('js');
    const revealItems = Array.from(section.querySelectorAll<HTMLElement>('.reveal'));
    const isInViewport = (element: HTMLElement): boolean => {
      const bounds = element.getBoundingClientRect();
      return bounds.bottom > 0 && bounds.top < window.innerHeight;
    };

    for (const element of revealItems) {
      if (isInViewport(element)) {
        element.classList.add('is-in');
      }
    }

    if (!('IntersectionObserver' in window)) {
      revealItems.forEach((element) => element.classList.add('is-in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    revealItems.forEach((element) => observer.observe(element));

    const safetyTimer = window.setTimeout(() => {
      revealItems
        .filter((element) => isInViewport(element))
        .forEach((element) => element.classList.add('is-in'));
    }, 2500);

    return () => {
      observer.disconnect();
      window.clearTimeout(safetyTimer);
    };
  }, []);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !sectionRef.current) {
        return;
      }

      gsap.utils.toArray<HTMLElement>('.promise-disc-photo', sectionRef.current).forEach((disc) => {
        const article = disc.closest<HTMLElement>('.promise');
        if (!article) {
          return;
        }
        gsap.fromTo(
          disc,
          { yPercent: 6 },
          {
            yPercent: -6,
            ease: 'none',
            scrollTrigger: {
              trigger: article,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );
      });
    },
    { scope: sectionRef },
  );

  return (
    <SectionShell
      className="appetite-section"
      ref={sectionRef}
      aria-labelledby="appetite-title"
      bgStart={homeSectionById.appetite.bgStart}
      bgEnd={homeSectionById.appetite.bgEnd}
      prevBg={homeSectionById.hero.bgEnd}
      seam="none"
    >
      <div className="appetite-layout">
        <div className="appetite-content">
          <p className="appetite-label reveal" data-content="text">Notre cuisine</p>
          <h2 className="appetite-title reveal" id="appetite-title" data-content="text">
            <span>À chaque faim,</span>
            <span className="appetite-title-gold">son assiette.</span>
          </h2>
          <p className="appetite-description reveal" data-content="text">
            Du premier café au dernier dessert, KLB vous accueille tous les jours, de{' '}
            {formatOpeningHours()}.
          </p>
          <TransitionLink className="appetite-link reveal" to="/carte" data-content="text">
            Voir la carte
            <ArrowRight aria-hidden="true" size={20} />
          </TransitionLink>
        </div>

        <div className="promise-list">
          {promises.map((item, index) => {
            const Icon = item.Icon;
            return (
              <article
                className={`promise promise--${index + 1}`}
                key={item.title}
                aria-labelledby={`promise-title-${index + 1}`}
              >
                <div className="promise-card">
                  <div className="promise-disc-wrap">
                    <PromiseDisc item={item} index={index} />
                    {index === 0 && <PromiseBadge />}
                  </div>
                  <div className="promise-caption reveal" data-content="text">
                    <span className="promise-icon" aria-hidden="true">
                      <Icon size={22} strokeWidth={1.5} />
                    </span>
                    <h3 id={`promise-title-${index + 1}`}>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}
