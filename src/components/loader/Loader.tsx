import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../../lib/motion';
import { splitChars } from '../../lib/splitChars';
import { resumeLenis, stopLenis } from '../../lib/lenis';

const INTRO_KEY = 'klb-intro-played';
const SLOGAN = 'Bonne cuisine, bonne ambiance.';

type IntroContextValue = {
  introDone: boolean;
  setIntroDone: (done: boolean) => void;
};

const IntroContext = createContext<IntroContextValue | null>(null);

export function IntroProvider({ children }: { children: ReactNode }) {
  const [introDone, setIntroDone] = useState(false);

  return (
    <IntroContext.Provider value={{ introDone, setIntroDone }}>
      {children}
    </IntroContext.Provider>
  );
}

export function useIntro(): IntroContextValue {
  const context = useContext(IntroContext);
  if (!context) {
    throw new Error('useIntro doit être utilisé dans IntroProvider.');
  }
  return context;
}

function hasPlayedIntro(): boolean {
  try {
    return sessionStorage.getItem(INTRO_KEY) === 'true';
  } catch {
    return false;
  }
}

function markIntroPlayed(): void {
  try {
    sessionStorage.setItem(INTRO_KEY, 'true');
  } catch {
    // Storage may be unavailable in private browsing; the intro still completes.
  }
}

export function Loader() {
  const { introDone, setIntroDone } = useIntro();
  const overlayRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<SVGPathElement>(null);
  const domeRef = useRef<SVGGElement>(null);
  const steamRef = useRef<SVGGElement>(null);
  const sloganRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || hasPlayedIntro()) {
        setIntroDone(true);
        return;
      }

      stopLenis();
      const chars = sloganRef.current?.querySelectorAll<HTMLElement>('.loader-char');
      const timeline = gsap.timeline({
        onComplete: () => {
          markIntroPlayed();
          setIntroDone(true);
        },
      });

      timeline.fromTo(
        plateRef.current,
        { strokeDashoffset: 124 },
        { strokeDashoffset: 0, duration: 0.4, ease: 'none' },
      );
      timeline.to(
        domeRef.current,
        { y: -120, rotation: -6, duration: 1.2, ease: 'power4.out' },
        0.4,
      );
      timeline.fromTo(
        steamRef.current,
        { strokeDashoffset: 64, opacity: 1 },
        { strokeDashoffset: 0, duration: 0.7, ease: 'none' },
        0.5,
      );
      timeline.to(steamRef.current, { opacity: 0, duration: 0.35 }, 1.25);
      if (chars) {
        timeline.from(
          chars,
          {
            y: (index) => 40 - Math.sin((index / Math.max(chars.length - 1, 1)) * Math.PI) * 8,
            opacity: 0,
            duration: 0.18,
            stagger: 0.03,
            ease: 'power4.out',
          },
          1.6,
        );
      }
      timeline.to({}, { duration: 0.4 });
      timeline.to(revealRef.current, {
        clipPath: 'circle(150% at 50% 50%)',
        opacity: 0,
        duration: 0.7,
        ease: 'power4.out',
      });
      timeline.to(overlayRef.current, {
        yPercent: -100,
        duration: 0.9,
        ease: 'power4.inOut',
      });

      return () => {
        timeline.kill();
        resumeLenis();
      };
    },
    { scope: overlayRef, dependencies: [setIntroDone], revertOnUpdate: true },
  );

  if (introDone) {
    return null;
  }

  return (
    <div className="loader-overlay" ref={overlayRef} aria-label="KLB Restaurant">
      <div className="loader-reveal" ref={revealRef} aria-hidden="true" />
      <div className="loader-content">
        <svg
          className="loader-bell"
          viewBox="0 0 240 180"
          role="img"
          aria-label="Une cloche dorée se soulève"
        >
          <defs>
            <linearGradient id="bell-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD36B" />
              <stop offset="48%" stopColor="#F5A912" />
              <stop offset="100%" stopColor="#C9800B" />
            </linearGradient>
          </defs>
          <g className="loader-steam" ref={steamRef} fill="none" stroke="#FFD36B" strokeWidth="2">
            <path d="M82 88 C72 76 94 69 84 54 C78 45 84 39 88 34" strokeDasharray="64" />
            <path d="M118 82 C108 69 130 62 120 47 C114 38 120 32 124 27" strokeDasharray="64" />
            <path d="M154 88 C144 76 166 69 156 54 C150 45 156 39 160 34" strokeDasharray="64" />
          </g>
          <g ref={domeRef} className="loader-dome">
            <path
              d="M67 111 C67 73 91 45 120 45 C149 45 173 73 173 111 Z"
              fill="url(#bell-gold)"
            />
            <path d="M113 45 C113 37 116 33 120 33 C124 33 127 37 127 45" fill="url(#bell-gold)" />
          </g>
          <path
            ref={plateRef}
            d="M54 112 H186"
            fill="none"
            stroke="url(#bell-gold)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="124"
          />
        </svg>
        <p className="loader-slogan" ref={sloganRef} aria-label={SLOGAN}>
          {splitChars(SLOGAN, 'loader-char')}
        </p>
      </div>
    </div>
  );
}
