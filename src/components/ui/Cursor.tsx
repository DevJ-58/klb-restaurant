import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../../lib/motion';

// Add data-cursor="Glissez" (or another short label) to show a filled, labeled cursor on hover.
export function Cursor() {
  const enabled =
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
  const reducedMotion = enabled && prefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const quickPositions = useRef<{
    dotX: (value: number) => void;
    dotY: (value: number) => void;
    ringX?: (value: number) => void;
    ringY?: (value: number) => void;
  } | null>(null);
  const [hoverState, setHoverState] = useState({ expanded: false, label: '', textInput: false });
  const [mouseInside, setMouseInside] = useState(false);

  useGSAP(
    () => {
      if (!enabled || !dotRef.current) {
        return;
      }
      const positions: NonNullable<typeof quickPositions.current> = {
        dotX: gsap.quickTo(dotRef.current, 'x', {
          duration: reducedMotion ? 0 : 0.1,
          ease: 'power3.out',
        }),
        dotY: gsap.quickTo(dotRef.current, 'y', {
          duration: reducedMotion ? 0 : 0.1,
          ease: 'power3.out',
        }),
      };
      if (!reducedMotion && ringRef.current) {
        positions.ringX = gsap.quickTo(ringRef.current, 'x', {
          duration: reducedMotion ? 0 : 0.35,
          ease: 'power3.out',
        });
        positions.ringY = gsap.quickTo(ringRef.current, 'y', {
          duration: reducedMotion ? 0 : 0.35,
          ease: 'power3.out',
        });
      }
      quickPositions.current = positions;

      return () => {
        quickPositions.current = null;
      };
    },
    { scope: rootRef, dependencies: [enabled, reducedMotion], revertOnUpdate: true },
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const updateHoverState = (target: EventTarget | null): void => {
      if (!(target instanceof Element)) {
        setHoverState({ expanded: false, label: '', textInput: false });
        return;
      }
      const cursorTarget = target.closest<HTMLElement>('[data-cursor]');
      const interactive = target.closest('a, button');
      const textInput = target.closest('input, textarea, select, [contenteditable="true"]');
      setHoverState({
        expanded: Boolean(interactive || cursorTarget),
        label: cursorTarget?.dataset.cursor ?? '',
        textInput: Boolean(textInput),
      });
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (event.pointerType === 'touch') {
        return;
      }
      quickPositions.current?.dotX(event.clientX);
      quickPositions.current?.dotY(event.clientY);
      quickPositions.current?.ringX?.(event.clientX);
      quickPositions.current?.ringY?.(event.clientY);
      setMouseInside(true);
      document.body.classList.add('has-custom-cursor');
    };
    const onPointerLeave = (): void => {
      setMouseInside(false);
      document.body.classList.remove('has-custom-cursor');
    };
    const onPointerOver = (event: PointerEvent): void => updateHoverState(event.target);
    const onPointerOut = (event: PointerEvent): void => updateHoverState(event.relatedTarget);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerover', onPointerOver);
    window.addEventListener('pointerout', onPointerOut);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('blur', onPointerLeave);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerover', onPointerOver);
      window.removeEventListener('pointerout', onPointerOut);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('blur', onPointerLeave);
      document.body.classList.remove('has-custom-cursor');
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <div
      className={`custom-cursor${mouseInside && !hoverState.textInput ? '' : ' custom-cursor--hidden'}`}
      ref={rootRef}
      aria-hidden="true"
    >
      <span className="cursor-dot" ref={dotRef} />
      {!reducedMotion && (
        <span
          className={`cursor-ring${hoverState.expanded ? ' cursor-ring--expanded' : ''}${hoverState.label ? ' cursor-ring--labeled' : ''}`}
          ref={ringRef}
        >
          <span className="cursor-ring-inner">{hoverState.label}</span>
        </span>
      )}
    </div>
  );
}
