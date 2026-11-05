import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const MAGNETIC_SELECTOR =
  '[data-magnetic], .header-order, .appetite-link, .marquee-button, .featured-final-circle, .order-button--gold';
const LERP = 0.18;
const SETTLE_DISTANCE = 0.1;

type MagneticPosition = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function MagneticButtons() {
  const location = useLocation();

  useEffect(() => {
    if (
      !window.matchMedia('(pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const positions = new Map<HTMLElement, MagneticPosition>();
    let elements: HTMLElement[] = [];
    let lastCollectedAt = 0;
    let frame: number | null = null;
    const refreshTimers: number[] = [];

    const collectElements = (): void => {
      const nextElements = Array.from(document.querySelectorAll<HTMLElement>(MAGNETIC_SELECTOR));
      const nextSet = new Set(nextElements);
      for (const element of elements) {
        if (!nextSet.has(element)) {
          const position = positions.get(element);
          if (position) {
            position.targetX = 0;
            position.targetY = 0;
          } else {
            element.style.translate = '';
          }
        }
      }
      elements = nextElements;
      lastCollectedAt = performance.now();
    };

    const animate = (): void => {
      let needsAnotherFrame = false;

      for (const [element, position] of positions) {
        if (!element.isConnected) {
          positions.delete(element);
          continue;
        }

        const deltaX = position.targetX - position.x;
        const deltaY = position.targetY - position.y;
        if (Math.abs(deltaX) < SETTLE_DISTANCE && Math.abs(deltaY) < SETTLE_DISTANCE) {
          position.x = position.targetX;
          position.y = position.targetY;
          if (position.x === 0 && position.y === 0) {
            element.style.translate = '';
            positions.delete(element);
          } else {
            element.style.translate = `${position.x}px ${position.y}px`;
          }
          continue;
        }

        position.x += deltaX * LERP;
        position.y += deltaY * LERP;
        element.style.translate = `${position.x}px ${position.y}px`;
        needsAnotherFrame = true;
      }

      if (needsAnotherFrame) {
        frame = window.requestAnimationFrame(animate);
      } else {
        frame = null;
      }
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (event.pointerType === 'touch') {
        return;
      }
      if (performance.now() - lastCollectedAt > 2000) {
        collectElements();
      }

      for (const element of elements) {
        const bounds = element.getBoundingClientRect();
        const computed = window.getComputedStyle(element);
        const visible =
          bounds.width > 0 &&
          bounds.height > 0 &&
          bounds.right > 0 &&
          bounds.bottom > 0 &&
          bounds.left < window.innerWidth &&
          bounds.top < window.innerHeight &&
          computed.display !== 'none' &&
          computed.visibility !== 'hidden' &&
          Number.parseFloat(computed.opacity) > 0;
        let position = positions.get(element);
        if (!position) {
          position = { x: 0, y: 0, targetX: 0, targetY: 0 };
          positions.set(element, position);
        }

        if (!visible) {
          position.targetX = 0;
          position.targetY = 0;
          continue;
        }

        const centerX = bounds.left + bounds.width / 2 - position.x;
        const centerY = bounds.top + bounds.height / 2 - position.y;
        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;
        const distance = Math.hypot(dx, dy);
        const activationDistance = Math.max(bounds.width, bounds.height) * 0.9 + 40;
        if (distance < activationDistance) {
          position.targetX = clamp(dx * 0.28, -14, 14);
          position.targetY = clamp(dy * 0.28, -14, 14);
        } else {
          position.targetX = 0;
          position.targetY = 0;
        }
      }

      if (frame === null && positions.size > 0) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    collectElements();
    refreshTimers.push(window.setTimeout(collectElements, 600));
    refreshTimers.push(window.setTimeout(collectElements, 1800));
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      for (const timer of refreshTimers) {
        window.clearTimeout(timer);
      }
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
      for (const element of positions.keys()) {
        element.style.translate = '';
      }
      positions.clear();
    };
  }, [location.key]);

  return null;
}
