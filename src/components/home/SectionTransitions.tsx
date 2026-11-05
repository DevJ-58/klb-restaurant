import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../lib/motion';

gsap.registerPlugin(ScrollTrigger);

export function SectionTransitions({ scope }: { scope: HTMLElement | null }) {
  useGSAP(
    () => {
      if (!scope || prefersReducedMotion()) {
        return;
      }

      const source = scope.querySelector<HTMLAnchorElement>('.featured-final-circle');
      const target = scope.querySelector<HTMLElement>('.chiffres-circle--gold');
      const chiffres = scope.querySelector<HTMLElement>('.chiffres-section');
      if (!source || !target || !chiffres) {
        return;
      }

      const sharedCircle = source.cloneNode(true) as HTMLAnchorElement;
      sharedCircle.classList.add('featured-final-circle--shared');
      sharedCircle.removeAttribute('href');
      sharedCircle.removeAttribute('id');
      sharedCircle.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      sharedCircle.setAttribute('aria-hidden', 'true');
      sharedCircle.setAttribute('tabindex', '-1');
      Object.assign(sharedCircle.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        margin: '0',
        transformOrigin: 'top left',
        transition: 'none',
        pointerEvents: 'none',
        zIndex: '999',
      });
      document.body.append(sharedCircle);
      gsap.set(sharedCircle, { autoAlpha: 0 });

      let frame = 0;
      const update = (): void => {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(() => {
          const sectionTop = chiffres.getBoundingClientRect().top + window.scrollY;
          const progress = (window.scrollY - (sectionTop - window.innerHeight)) / window.innerHeight;
          if (progress < 0 || progress > 1) {
            gsap.set(sharedCircle, { autoAlpha: 0 });
            return;
          }

          const start = source.getBoundingClientRect();
          const finish = target.getBoundingClientRect();
          const boost = 1 + Math.sin(progress * Math.PI) * 0.12;
          gsap.set(sharedCircle, {
            x: gsap.utils.interpolate(start.left, finish.left, progress),
            y: gsap.utils.interpolate(start.top, finish.top, progress),
            scaleX:
              gsap.utils.interpolate(1, finish.width / Math.max(start.width, 1), progress) *
              boost,
            scaleY:
              gsap.utils.interpolate(1, finish.height / Math.max(start.height, 1), progress) *
              boost,
            autoAlpha: Math.min(1, (1 - progress) * 5.5),
          });
        });
      };

      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
        window.cancelAnimationFrame(frame);
        window.cancelAnimationFrame(refreshFrame);
        sharedCircle.remove();
      };
    },
    { scope: scope ?? undefined, dependencies: [scope], revertOnUpdate: true },
  );

  return null;
}
