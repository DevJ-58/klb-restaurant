import { useLayoutEffect, useRef } from 'react';
import { homeSectionById } from '../../data/sections';
import { prefersReducedMotion } from '../../lib/motion';
import { SectionShell } from '../layout/SectionShell';
import { SectionTitle } from '../ui/SectionTitle';
import { OrderTile } from './OrderTile';

export function OrderTiles() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const tiles = Array.from(section.querySelectorAll<HTMLElement>('.order-tile.reveal'));
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      tiles.forEach((tile) => tile.classList.add('is-in'));
      return;
    }

    const pending: HTMLElement[] = [];
    tiles.forEach((tile) => {
      const bounds = tile.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) {
        tile.classList.add('is-in');
      } else {
        tile.classList.add('is-pending');
        pending.push(tile);
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
    pending.forEach((tile) => observer.observe(tile));

    const failsafe = window.setTimeout(() => {
      tiles.forEach((tile) => {
        tile.classList.remove('is-pending');
        tile.classList.add('is-in');
      });
      observer.disconnect();
    }, 2500);

    return () => {
      window.clearTimeout(failsafe);
      observer.disconnect();
    };
  }, []);

  const section = homeSectionById.orderTiles;

  return (
    <SectionShell
      ref={sectionRef}
      id="order-tiles"
      className="order-tiles-section"
      bgStart={section.bgStart}
      bgEnd={section.bgEnd}
      seam={section.seam}
      data-surface="light"
      aria-labelledby="order-tiles-title"
    >
      <header className="order-tiles-heading">
        <SectionTitle id="order-tiles-title" size="compact" className="order-tiles-title">
          Comment passer à table ?
        </SectionTitle>
      </header>
      <div className="order-tiles-grid">
        <OrderTile type="remote" />
        <OrderTile type="table" />
      </div>
    </SectionShell>
  );
}
