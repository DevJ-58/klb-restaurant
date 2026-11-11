import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLocation, useNavigate, type To } from 'react-router-dom';
import { scrollToTop } from '../../lib/lenis';
import { prefersReducedMotion } from '../../lib/motion';
import './transitions.css';

const NORMAL_COVER = 450;
const NORMAL_REVEAL = 350;
const REDUCED_DURATION = 200;

type TransitionContextValue = {
  isTransitioning: boolean;
  transitionTo: (to: To) => void;
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
  const curtainRef = useRef<HTMLDivElement>(null);
  const isTransitioningRef = useRef(false);
  const pendingToRef = useRef<To | null>(null);
  const previousPathRef = useRef(location.pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [curtainState, setCurtainState] = useState<'hidden' | 'covering' | 'revealing'>('hidden');
  const timersRef = useRef<number[]>([]);

  const finishTransition = useCallback((): void => {
    pendingToRef.current = null;
    isTransitioningRef.current = false;
    setIsTransitioning(false);
    setCurtainState('hidden');
    focusPageHeading();
  }, []);

  const beginTransition = useCallback(
    (to: To | null): void => {
      if (isTransitioningRef.current || !curtainRef.current) {
        return;
      }

      const reduced = prefersReducedMotion();
      const coverDuration = reduced ? REDUCED_DURATION : NORMAL_COVER;
      const revealDuration = reduced ? REDUCED_DURATION : NORMAL_REVEAL;
      pendingToRef.current = to;
      isTransitioningRef.current = true;
      setIsTransitioning(true);
      setCurtainState('covering');

      timersRef.current.push(
        window.setTimeout(() => {
          const target = pendingToRef.current;
          if (target) {
            pendingToRef.current = null;
            navigate(target);
            refreshPage();
          }
          setCurtainState('revealing');
          timersRef.current.push(
            window.setTimeout(() => {
              window.dispatchEvent(new Event('klb:revealed'));
            }, revealDuration / 2),
          );
          timersRef.current.push(window.setTimeout(finishTransition, revealDuration));
        }, coverDuration),
      );
    },
    [finishTransition, navigate],
  );

  const transitionTo = useCallback((to: To) => beginTransition(to), [beginTransition]);

  useEffect(() => {
    if (previousPathRef.current === location.pathname) {
      return;
    }
    previousPathRef.current = location.pathname;

    if (!isTransitioningRef.current) {
      beginTransition(null);
    }
  }, [beginTransition, location.pathname]);

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  return (
    <TransitionContext.Provider value={{ isTransitioning, transitionTo }}>
      {children}
      <div
        className={`transition-curtain${curtainState === 'hidden' ? '' : ` is-${curtainState}`}`}
        ref={curtainRef}
        aria-hidden="true"
      >
        <svg className="transition-curtain__bell" viewBox="0 0 48 48">
          <path d="M10 31c0-12 6-20 14-20s14 8 14 20M7 33h34M20 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
    </TransitionContext.Provider>
  );
}
