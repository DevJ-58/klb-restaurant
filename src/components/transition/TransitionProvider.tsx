import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLocation, useNavigate, type To } from 'react-router-dom';
import { scrollToTop } from '../../lib/lenis';
import { prefersReducedMotion } from '../../lib/motion';
import { splitChars } from '../../lib/splitChars';

gsap.registerPlugin(ScrollTrigger);

type TransitionContextValue = {
  isTransitioning: boolean;
  transitionTo: (to: To, title: string) => void;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function usePageTransition(): TransitionContextValue {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error('usePageTransition doit être utilisé dans TransitionProvider.');
  }
  return context;
}

function refreshPage(): void {
  window.requestAnimationFrame(() => {
    scrollToTop();
    ScrollTrigger.refresh();
  });
}

function focusPageHeading(): void {
  window.requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('#contenu h1')?.focus({ preventScroll: true });
  });
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate);
  const curtainRef = useRef<HTMLDivElement>(null);
  const isTransitioningRef = useRef(false);
  const pendingToRef = useRef<To | null>(null);
  const previousPathRef = useRef(location.pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [curtainMode, setCurtainMode] = useState<'curtain' | 'fade'>('curtain');
  const [pageTitle, setPageTitle] = useState('');
  navigateRef.current = navigate;
  useGSAP({ scope: curtainRef });

  const finishTransition = useCallback(() => {
    pendingToRef.current = null;
    isTransitioningRef.current = false;
    setIsTransitioning(false);
    focusPageHeading();
  }, []);

  const transitionTo = useCallback(
    (to: To, title: string) => {
      if (isTransitioningRef.current || !curtainRef.current) {
        return;
      }

      pendingToRef.current = to;
      isTransitioningRef.current = true;
      setPageTitle(title);
      setCurtainMode(prefersReducedMotion() ? 'fade' : 'curtain');
      setIsTransitioning(true);
    },
    [],
  );

  useGSAP(
    () => {
      const curtain = curtainRef.current;
      if (!isTransitioning || !curtain) {
        return;
      }

      if (curtainMode === 'fade') {
        const isRouteTransition = pendingToRef.current !== null;
        gsap.set(curtain, { yPercent: 0, opacity: 0 });
        const timeline = gsap.timeline({ onComplete: finishTransition });
        timeline.to(curtain, {
          opacity: 1,
          duration: isRouteTransition ? 0.1 : 0.125,
        });
        timeline.call(() => {
          const to = pendingToRef.current;
          if (to) {
            pendingToRef.current = null;
            navigateRef.current(to);
          }
          refreshPage();
        });
        timeline.to(curtain, {
          opacity: 0,
          duration: isRouteTransition ? 0.1 : 0.125,
        });
        return;
      }

      gsap.set(curtain, { yPercent: 100, opacity: 1 });
      const chars = curtain.querySelectorAll<HTMLElement>('.transition-char');
      const timeline = gsap.timeline({ onComplete: finishTransition });
      timeline.to(curtain, { yPercent: 0, duration: 0.7, ease: 'expo.inOut' });
      timeline.call(() => {
        const to = pendingToRef.current;
        if (to) {
          pendingToRef.current = null;
          navigateRef.current(to);
          refreshPage();
        }
      });
      timeline.from(chars, {
        y: 32,
        opacity: 0,
        duration: 0.2,
        stagger: 0.03,
        ease: 'power4.out',
      });
      timeline.to(
        curtain,
        { yPercent: -100, duration: 0.7, ease: 'expo.inOut' },
        '+=0.12',
      );
    },
    {
      scope: curtainRef,
      dependencies: [curtainMode, finishTransition, isTransitioning, pageTitle],
      revertOnUpdate: true,
    },
  );

  useEffect(() => {
    if (previousPathRef.current === location.pathname) {
      return;
    }
    previousPathRef.current = location.pathname;

    if (isTransitioningRef.current || !curtainRef.current) {
      return;
    }

    isTransitioningRef.current = true;
    setIsTransitioning(true);
    setCurtainMode('fade');
    pendingToRef.current = null;
    isTransitioningRef.current = true;
    setPageTitle('');
    setCurtainMode('fade');
    setIsTransitioning(true);
  }, [location.pathname]);

  return (
    <TransitionContext.Provider value={{ isTransitioning, transitionTo }}>
      {children}
      <div
        className={`transition-curtain transition-curtain--${curtainMode}${isTransitioning ? ' is-active' : ''}`}
        ref={curtainRef}
        aria-hidden="true"
      >
        {pageTitle && (
          <p className="transition-title" aria-label={pageTitle}>
            {splitChars(pageTitle, 'transition-char')}
          </p>
        )}
      </div>
    </TransitionContext.Provider>
  );
}
