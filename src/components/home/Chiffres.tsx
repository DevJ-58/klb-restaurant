import { useRef, useState } from 'react';
import { ChefHat } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { site } from '../../config/site';
import { countItems } from '../../data/menu';
import { prefersReducedMotion } from '../../lib/motion';
import { homeSectionById } from '../../data/sections';
import { useReveal } from '../../lib/useReveal';
import { SectionShell } from '../layout/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';

gsap.registerPlugin(ScrollTrigger);

function openingDuration(): number {
  const hours = Object.values(site.openingHours)[0];
  const toMinutes = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  };
  return (toMinutes(hours.closes) - toMinutes(hours.opens)) / 60;
}

function ChefPhoto() {
  const [unavailable, setUnavailable] = useState(false);

  return unavailable ? (
    <span className="chiffres-photo-fallback" role="img" aria-label="Équipe KLB">
      <ChefHat aria-hidden="true" size={48} strokeWidth={1.4} />
    </span>
  ) : (
    <img
      className="chiffres-photo"
      src="/images/equipe/equipe-chef.jpg"
      alt="Le chef de KLB en cuisine"
      onError={() => setUnavailable(true)}
    />
  );
}

export function Chiffres() {
  const sectionRef = useRef<HTMLElement>(null);
  const openingHours = openingDuration();
  const counts = [
    { value: 7, label: 'jours sur 7', kind: 'days' },
    { value: openingHours, label: 'd’ouverture par jour', kind: 'hours' },
    { value: countItems('plats-sur-commande'), label: 'plats sur commande', kind: 'dishes' },
    { value: countItems('garnitures'), label: 'garnitures au choix', kind: 'sides' },
  ];

  useReveal(sectionRef, { selector: '.chiffres-circle', stagger: 0.1 });

  useGSAP(
    () => {
      if (prefersReducedMotion() || !sectionRef.current) {
        return;
      }

      const section = sectionRef.current;
      gsap.utils.toArray<HTMLElement>('[data-count-target]', section).forEach((element) => {
        const target = Number(element.dataset.countTarget);
        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 1.6,
          ease: 'power2.out',
          snap: { value: 1 },
          scrollTrigger: { trigger: section, start: 'top 88%', once: true },
          onUpdate: () => {
            element.textContent = new Intl.NumberFormat('fr-FR').format(counter.value);
          },
        });
      });
    },
    { scope: sectionRef },
  );

  return (
    <SectionShell
      className="chiffres-section"
      ref={sectionRef}
      aria-labelledby="chiffres-title"
      bgStart={homeSectionById.chiffres.bgStart}
      bgEnd={homeSectionById.chiffres.bgEnd}
      prevBg={homeSectionById.incontournables.bgEnd}
      seam="none"
    >
      <svg className="chiffres-shape chiffres-shape--one" viewBox="0 0 640 440" aria-hidden="true">
        <path d="M66 131C113 50 240 34 314 81c62 39 69 103 146 117 61 11 119 51 115 112-5 72-93 99-180 88-71-9-112-48-183-35-70 13-145-10-168-63-22-50-8-119 22-169Z" />
      </svg>
      <svg className="chiffres-shape chiffres-shape--two" viewBox="0 0 620 460" aria-hidden="true">
        <path d="M104 79c76-58 168-10 221 30 55 42 109 40 170 34 76-7 116 48 90 112-22 52-84 72-113 119-35 56-94 72-156 39-55-29-111-26-172-10-66 17-120-20-117-79 2-51 49-85 47-137-1-42-10-82 30-108Z" />
      </svg>
      <div className="chiffres-content" data-content>
        <SectionTitle id="chiffres-title">KLB en un coup d’œil</SectionTitle>
        <div className="chiffres-circles">
          <div className="chiffres-item">
            <div className="chiffres-circle chiffres-circle--forest" data-content>
              <p className="chiffres-number"><span data-count-target={counts[0].value}>7</span><small>/7</small></p>
            </div>
            <p className="chiffres-label">{counts[0].label}</p>
          </div>
          <div className="chiffres-item">
            <div className="chiffres-circle chiffres-circle--gold" data-content>
              <p className="chiffres-number chiffres-number--hours">
                <span data-count-target={counts[1].value}>{counts[1].value}</span> h
              </p>
            </div>
            <p className="chiffres-label">{counts[1].label}</p>
          </div>
          <div className="chiffres-item">
            <div className="chiffres-circle chiffres-circle--espresso" data-content>
              <p className="chiffres-number" data-count-target={counts[2].value}>
                {new Intl.NumberFormat('fr-FR').format(counts[2].value)}
              </p>
            </div>
            <p className="chiffres-label">{counts[2].label}</p>
          </div>
          <div className="chiffres-item">
            <div className="chiffres-circle chiffres-circle--ivory" data-content>
              <p className="chiffres-number" data-count-target={counts[3].value}>
                {new Intl.NumberFormat('fr-FR').format(counts[3].value)}
              </p>
            </div>
            <p className="chiffres-label">{counts[3].label}</p>
          </div>
          <div className="chiffres-item chiffres-item--photo">
            <div className="chiffres-circle chiffres-circle--photo" role="img" aria-label="Le chef de KLB en cuisine" data-content>
              <ChefPhoto />
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
