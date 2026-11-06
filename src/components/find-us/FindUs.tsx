import { useEffect, useRef } from 'react';
import { ArrowUpRight, MapPin, MessageCircle, Phone } from 'lucide-react';
import { site } from '../../config/site';
import { SectionShell } from '../layout/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';
import { prefersReducedMotion } from '../../lib/motion';
import { formatPhone } from '../../lib/hours';
import { HoursCard } from './HoursCard';
import { MapVisual } from './MapVisual';

type FindUsProps = {
  variant?: 'home' | 'page';
};

export function FindUs({ variant = 'home' }: FindUsProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const targets = Array.from(section.querySelectorAll<HTMLElement>('.reveal'));
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-in'));
      return;
    }

    const pending: HTMLElement[] = [];
    targets.forEach((target) => {
      const bounds = target.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) {
        target.classList.add('is-in');
      } else {
        target.classList.add('is-pending');
        pending.push(target);
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('is-pending');
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05 },
    );
    pending.forEach((target) => observer.observe(target));

    const failsafe = window.setTimeout(() => {
      targets.forEach((target) => {
        target.classList.remove('is-pending');
        target.classList.add('is-in');
      });
      observer.disconnect();
    }, 2500);

    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
    };
  }, []);

  return (
    <SectionShell
      ref={sectionRef}
      className={`find-us-section${variant === 'page' ? ' find-us-section--page' : ''}`}
      bgStart="surface-raised"
      bgEnd="surface-raised"
      seam="dome"
      prevBg="ivory"
      aria-labelledby="find-us-title"
    >
      <div className="find-us-layout">
        <header className="find-us-heading reveal">
          {variant === 'home' && <p className="find-us-eyebrow">Nous trouver</p>}
          <SectionTitle id="find-us-title" className="find-us-title">
            {variant === 'home' ? 'Rendez-vous à Morofé' : 'Comment nous joindre'}
          </SectionTitle>
        </header>

        <div className="find-us-details">
          <section className="find-us-block find-us-address reveal" data-content>
            <span className="find-us-icon-ring" aria-hidden="true">
              <MapPin size={20} strokeWidth={1.7} />
            </span>
            <div className="find-us-block-copy">
              <h3 className="find-us-block-title">Quartier {site.neighborhood}</h3>
              <p className="find-us-muted">{site.city}, {site.country}</p>
              <a
                className="find-us-primary-button"
                href={site.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Itinéraire</span>
                <ArrowUpRight aria-hidden="true" size={20} />
              </a>
            </div>
          </section>

          <HoursCard />

          <section className="find-us-block find-us-contact reveal" data-content>
            <div className="find-us-contact-actions">
              <a className="find-us-phone" href={site.phoneLink}>
                <Phone aria-hidden="true" size={19} />
                <span>{formatPhone(site.phone)}</span>
              </a>
              <a
                className="find-us-whatsapp-button"
                href={site.whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle aria-hidden="true" size={19} />
                <span>Écrire sur WhatsApp</span>
              </a>
            </div>
            <p className="find-us-muted">
              Pour commander à distance, appelez-nous ou écrivez-nous. Au restaurant, le menu de
              votre table s’ouvre avec son QR code.
            </p>
            {site.tableMenuUrl && (
              <a
                className="find-us-table-menu"
                href={site.tableMenuUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ouvrir le menu de ma table
                <ArrowUpRight aria-hidden="true" size={16} />
              </a>
            )}
          </section>
        </div>

        <div className="find-us-visual">
          <MapVisual />
        </div>
      </div>
    </SectionShell>
  );
}
