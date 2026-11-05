import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { RefObject } from 'react';
import { prefersReducedMotion } from './motion';

gsap.registerPlugin(ScrollTrigger);

export type RevealOptions = {
  selector?: string;
  duration?: number;
  stagger?: number;
  start?: string;
};

export function useReveal(
  scope: RefObject<HTMLElement | null>,
  { selector = '[data-reveal]', duration = 0.9, stagger = 0.1, start = 'top 88%' }: RevealOptions = {},
): void {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root || prefersReducedMotion()) {
        return;
      }

      const targets = gsap.utils.toArray<HTMLElement>(selector, root);
      if (targets.length === 0) {
        return;
      }

      const distance = Number.parseFloat(
        getComputedStyle(root).getPropertyValue('--reveal-y'),
      ) || 32;
      const trigger = ScrollTrigger.create({
        trigger: root,
        start,
        once: true,
        onEnter: () => {
          gsap.fromTo(
            targets,
            { y: distance, opacity: 0 },
            {
              y: 0, opacity: 1, duration, stagger,
              ease: 'power4.out',
              overwrite: true,
            },
          );
        },
      });
      return () => trigger.kill();
    },
    { scope, dependencies: [scope, selector, duration, stagger, start], revertOnUpdate: true },
  );
}
