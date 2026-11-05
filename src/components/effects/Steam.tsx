import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useIntro } from '../loader/Loader';

const wisps = [
  { x: 42, y: 46, size: 90, dur: 9, delay: 0, drift: -18 },
  { x: 50, y: 50, size: 120, dur: 11, delay: 1.6, drift: 12 },
  { x: 57, y: 44, size: 100, dur: 8.5, delay: 3.1, drift: -8 },
  { x: 46, y: 48, size: 140, dur: 12, delay: 4.4, drift: 20 },
  { x: 53, y: 52, size: 110, dur: 10, delay: 5.8, drift: -14 },
  { x: 61, y: 45, size: 95, dur: 9.5, delay: 2.2, drift: 16 },
  { x: 39, y: 49, size: 130, dur: 11.5, delay: 6.9, drift: -22 },
] as const;

type SteamWispStyle = CSSProperties & {
  '--x': string;
  '--y': string;
  '--size': number;
  '--dur': number;
  '--delay': number;
  '--drift': number;
};

type SteamContainerStyle = CSSProperties & {
  '--steam-on': number;
};

export function Steam() {
  const { introDone } = useIntro();
  const steamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const steam = steamRef.current;
    if (!steam) {
      return;
    }

    const updateScroll = (): void => {
      const scrollProgress = Math.max(
        0,
        1 - window.scrollY / (window.innerHeight * 0.18),
      );
      steam.style.setProperty('--steam-scroll', String(scrollProgress));
      steam.dataset.paused = String(scrollProgress === 0);
    };

    let frame: number | null = null;
    const onScroll = (): void => {
      if (frame !== null) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = null;
        updateScroll();
      });
    };

    updateScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div
      className="steam"
      ref={steamRef}
      style={{ '--steam-on': introDone ? 1 : 0 } as SteamContainerStyle}
      aria-hidden="true"
    >
      {wisps.map((wisp, index) => (
        <span
          className="steam-wisp"
          key={index}
          style={
            {
              '--x': `${wisp.x}%`,
              '--y': `${wisp.y}%`,
              '--size': wisp.size,
              '--dur': wisp.dur,
              '--delay': wisp.delay,
              '--drift': wisp.drift,
            } as SteamWispStyle
          }
        />
      ))}
    </div>
  );
}
