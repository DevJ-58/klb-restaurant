import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const easing = {
  out: 'power4.out',
  strong: 'power4.inOut',
  page: 'expo.inOut',
} as const;

export const durations = {
  micro: 0.15,
  small: 0.25,
  medium: 0.4,
  large: 0.75,
  loader: 1.6,
} as const;

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
