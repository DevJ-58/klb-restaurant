import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;

export function startLenis(): (() => void) | undefined {
  if (prefersReducedMotion() || lenisInstance) {
    return undefined;
  }

  const lenis = new Lenis();
  lenisInstance = lenis;
  lenis.on('scroll', ScrollTrigger.update);

  const updateLenis = (time: number): void => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(updateLenis);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(updateLenis);
    lenis.destroy();
    lenisInstance = null;
  };
}

export function scrollToTop(): void {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { immediate: true });
    return;
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function scrollLenisTo(target: number, immediate = false): void {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, { immediate });
    if (immediate) {
      window.scrollTo({ top: target, behavior: 'instant' });
    }
    return;
  }

  window.scrollTo({ top: target, behavior: 'instant' });
}

export function stopLenis(): void {
  lenisInstance?.stop();
}

export function resumeLenis(): void {
  lenisInstance?.start();
}
