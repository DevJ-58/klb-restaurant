import { MapPin, MessageCircle, Phone, QrCode } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { site } from '../../config/site';
import { useIntro } from '../loader/Loader';

gsap.registerPlugin(ScrollTrigger);

const actions = [
  { label: 'Appeler', shortLabel: 'Appeler', href: site.phoneLink, Icon: Phone },
  {
    label: 'WhatsApp',
    shortLabel: 'WhatsApp',
    href: site.whatsappLink(),
    Icon: MessageCircle,
    external: true,
  },
  ...(site.tableMenuUrl
    ? [
        {
          label: 'Menu de ma table',
          shortLabel: 'Menu',
          href: site.tableMenuUrl,
          Icon: QrCode,
          external: true,
        },
      ]
    : []),
  {
    label: 'Itinéraire',
    shortLabel: 'Itinéraire',
    href: site.googleMapsUrl,
    Icon: MapPin,
    external: true,
  },
];

export function ActionBar() {
  const { introDone } = useIntro();
  const barRef = useRef<HTMLElement>(null);
  const entryPlayedRef = useRef(false);
  const { pathname } = useLocation();

  useGSAP(
    () => {
      const bar = barRef.current;
      if (!introDone || !bar || entryPlayedRef.current) {
        return;
      }
      entryPlayedRef.current = true;
      gsap.fromTo(
        bar,
        { y: 48, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power4.out',
          onComplete: () => gsap.set(bar, { clearProps: 'transform,opacity,visibility' }),
        },
      );
    },
    { scope: barRef, dependencies: [introDone], revertOnUpdate: true },
  );

  useGSAP(
    () => {
      const bar = barRef.current;
      const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-theme]'));
      if (!bar || sections.length === 0) {
        return;
      }

      const updateTheme = (): void => {
        const probeY = window.innerHeight - bar.offsetHeight / 2;
        const sectionAtProbe = sections.find((section) => {
          const bounds = section.getBoundingClientRect();
          return bounds.top <= probeY && bounds.bottom > probeY;
        });
        if (sectionAtProbe) {
          bar.dataset.on = sectionAtProbe.dataset.theme === 'light' ? 'light' : 'dark';
        }
      };

      const triggers = sections.map((section) =>
        ScrollTrigger.create({
          trigger: section,
          start: () => `top ${window.innerHeight - bar.offsetHeight / 2}px`,
          end: () => `bottom ${window.innerHeight - bar.offsetHeight / 2}px`,
          onToggle: updateTheme,
        }),
      );
      ScrollTrigger.addEventListener('refresh', updateTheme);
      updateTheme();

      return () => {
        ScrollTrigger.removeEventListener('refresh', updateTheme);
        triggers.forEach((trigger) => trigger.kill());
      };
    },
    { scope: barRef, dependencies: [pathname], revertOnUpdate: true },
  );

  const bar = (
    <nav
      className="action-bar"
      aria-label="Actions rapides"
      data-actionbar
      data-on="dark"
      ref={barRef}
    >
      {actions.map(({ label, shortLabel, href, Icon, external }) => (
        <a
          className="action-bar-item"
          href={href}
          key={label}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
          aria-label={label}
        >
          <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
          <span className="action-bar-label">{label}</span>
          <span className="action-bar-short-label">{shortLabel}</span>
        </a>
      ))}
    </nav>
  );

  return createPortal(bar, document.body);
}
