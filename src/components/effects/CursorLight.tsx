import { useEffect, useRef } from 'react';

export function CursorLight() {
  const lightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const light = lightRef.current;
    const finePointer = window.matchMedia('(pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!light || !finePointer.matches || reducedMotion.matches) {
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let initialized = false;
    let frame: number | null = null;

    const renderPosition = (): void => {
      light.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    };

    const animate = (): void => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      if (Math.abs(targetX - currentX) < 0.1 && Math.abs(targetY - currentY) < 0.1) {
        currentX = targetX;
        currentY = targetY;
        renderPosition();
        frame = null;
        return;
      }

      renderPosition();
      frame = window.requestAnimationFrame(animate);
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (event.pointerType === 'touch') {
        return;
      }
      targetX = event.clientX;
      targetY = event.clientY;
      light.dataset.visible = 'true';

      if (!initialized) {
        currentX = targetX;
        currentY = targetY;
        initialized = true;
        renderPosition();
      } else if (frame === null) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const hide = (): void => {
      light.dataset.visible = 'false';
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }
    };

    light.dataset.visible = 'false';
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', hide, { passive: true });
    window.addEventListener('blur', hide);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return <div className="cursor-light" ref={lightRef} data-visible="false" aria-hidden="true" />;
}
