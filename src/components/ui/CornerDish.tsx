import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { UtensilsCrossed } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { site } from '../../config/site';
import { formatPrice, getItem, menu, type MenuItem, type Price } from '../../data/menu';
import { prefersReducedMotion } from '../../lib/motion';
import { SmartImage } from '../SmartImage';

gsap.registerPlugin(ScrollTrigger);

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

type CornerDishProps = {
  itemId: string;
  corner: Corner;
  size?: string | number;
  offset?: string | number;
  className?: string;
};

function findMenuItem(itemId: string): MenuItem {
  const item = getItem(itemId);
  if (!item) {
    throw new Error(`Plat introuvable dans le menu : ${itemId}`);
  }
  return item;
}

function findMenuItemPrice(itemId: string, item: MenuItem): Price | undefined {
  return item.price ?? menu.find((category) => category.items.some(({ id }) => id === itemId))?.price;
}

function cssLength(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value;
}

function useFloatingPosition(
  isOpen: boolean,
  corner: Corner,
  triggerRef: RefObject<HTMLButtonElement | null>,
  cardRef: RefObject<HTMLDivElement | null>,
): CSSProperties {
  const [position, setPosition] = useState<CSSProperties>({ opacity: 0 });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = (): void => {
      const trigger = triggerRef.current;
      const card = cardRef.current;
      if (!trigger || !card) {
        return;
      }

      const anchor = trigger.getBoundingClientRect();
      const panel = card.getBoundingClientRect();
      const gap = 12;
      const padding = 12;
      const prefersRight = corner.endsWith('left');
      const prefersBelow = corner.startsWith('top');
      const preferredLeft = prefersRight ? anchor.right + gap : anchor.left - panel.width - gap;
      const preferredTop = prefersBelow ? anchor.bottom + gap : anchor.top - panel.height - gap;
      const left = Math.min(
        Math.max(preferredLeft, padding),
        Math.max(padding, window.innerWidth - panel.width - padding),
      );
      const top = Math.min(
        Math.max(preferredTop, padding),
        Math.max(padding, window.innerHeight - panel.height - padding),
      );
      setPosition({ left, top, opacity: 1 });
    };

    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition, { passive: true });
    window.addEventListener('scroll', updatePosition, { passive: true, capture: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [cardRef, corner, isOpen, triggerRef]);

  return position;
}

export function CornerDish({
  itemId,
  corner,
  size = 'clamp(220px, 30vw, 440px)',
  offset = 0,
  className,
}: CornerDishProps) {
  const item = findMenuItem(itemId);
  const price = findMenuItemPrice(itemId, item);
  const priceLabel = price ? formatPrice(price) : undefined;
  const note = item.note ?? (item.tags?.includes('sur-commande') ? 'Sur commande' : undefined);
  const reactId = useId().replace(/:/g, '');
  const dishId = `corner-dish-card-${reactId}`;
  const arcId = `corner-dish-arc-${reactId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGSVGElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const lastPointerTypeRef = useRef<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const position = useFloatingPosition(isOpen, corner, triggerRef, cardRef);
  const dimensions: CSSProperties & {
    '--corner-dish-size': string;
    '--corner-dish-offset': string;
  } = {
    '--corner-dish-size': cssLength(size),
    '--corner-dish-offset': cssLength(offset),
  };

  const clearCloseTimer = (): void => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const closeWhenUnfocused = (): void => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      const activeElement = document.activeElement;
      if (
        activeElement !== triggerRef.current &&
        !cardRef.current?.contains(activeElement) &&
        !cardRef.current?.matches(':hover')
      ) {
        setIsOpen(false);
      }
    }, 140);
  };

  useGSAP(
    () => {
      const root = rootRef.current;
      const arc = arcRef.current;
      const badge = badgeRef.current;
      if (!root || !arc) {
        return;
      }

      if (prefersReducedMotion()) {
        gsap.set([root, arc, ...(badge ? [badge] : [])], { clearProps: 'transform,opacity' });
        return;
      }

      const enterX = corner.endsWith('left') ? -30 : 30;
      const enterY = corner.startsWith('top') ? -30 : 30;
      gsap.fromTo(
        root,
        { xPercent: enterX, yPercent: enterY, opacity: 0 },
        {
          xPercent: 0,
          yPercent: 0,
          opacity: 1,
          duration: 1,
          delay: 0.18,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: root,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        },
      );

      if (badge) {
        gsap.fromTo(
          badge,
          { scale: 0.65, rotation: -12 },
          {
            scale: 1,
            rotation: 0,
            duration: 0.8,
            delay: 0.55,
            ease: 'back.out(2)',
            scrollTrigger: {
              trigger: root,
              start: 'top 90%',
              toggleActions: 'play none none none',
            },
          },
        );
      }

      const section = root.closest('section');
      if (section) {
        gsap.to(arc, {
          rotation: 45,
          transformOrigin: '50% 50%',
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      }
    },
    { scope: rootRef, dependencies: [corner], revertOnUpdate: true },
  );

  useEffect(
    () => () => {
      clearCloseTimer();
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  function handleBlur(event: FocusEvent<HTMLButtonElement>): void {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && cardRef.current?.contains(nextTarget)) {
      return;
    }
    closeWhenUnfocused();
  }

  const card =
    typeof document !== 'undefined'
      ? createPortal(
          <div
            className="corner-dish-card"
            id={dishId}
            ref={cardRef}
            hidden={!isOpen}
            style={position}
            onPointerEnter={clearCloseTimer}
            onPointerLeave={closeWhenUnfocused}
            onBlurCapture={(event) => {
              const nextTarget = event.relatedTarget;
              if (!(nextTarget instanceof Node && cardRef.current?.contains(nextTarget))) {
                closeWhenUnfocused();
              }
            }}
          >
            <h2>{item.name}</h2>
            {note && <p>{note}</p>}
            {priceLabel && <p className="corner-dish-card-price">{priceLabel}</p>}
            <a href={site.whatsappLink(item.name)} target="_blank" rel="noreferrer">
              Commander ce plat
            </a>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        className={`corner-dish-positioner corner-dish-positioner--${corner}${className ? ` ${className}` : ''}`}
        ref={rootRef}
        style={dimensions}
      >
        <button
          className="corner-dish-trigger"
          type="button"
          aria-label={`${item.name}${priceLabel ? `, ${priceLabel}` : ''}`}
          aria-expanded={isOpen}
          aria-controls={dishId}
          data-cursor="Voir"
          data-content
          ref={triggerRef}
          onPointerDown={(event) => {
            lastPointerTypeRef.current = event.pointerType;
          }}
          onPointerEnter={() => {
            if (window.matchMedia('(pointer: fine)').matches) {
              clearCloseTimer();
              setIsOpen(true);
            }
          }}
          onPointerLeave={() => {
            if (window.matchMedia('(pointer: fine)').matches) {
              closeWhenUnfocused();
            }
          }}
          onFocus={() => {
            if (lastPointerTypeRef.current !== 'touch') {
              clearCloseTimer();
              setIsOpen(true);
            }
          }}
          onBlur={handleBlur}
          onClick={() => {
            if (lastPointerTypeRef.current === 'touch') {
              setIsOpen((open) => !open);
            } else {
              setIsOpen(true);
            }
            lastPointerTypeRef.current = null;
          }}
        >
          <span className="corner-dish-plate">
            <span className="corner-dish-image">
              <SmartImage
                src={item.image}
                alt=""
                aspectRatio="1 / 1"
                className="corner-dish-smart-image"
              />
              <span className="corner-dish-image-fallback" aria-hidden="true">
                <UtensilsCrossed size={30} strokeWidth={1.5} />
                <span>{item.name}</span>
              </span>
            </span>
          </span>
          <svg
            className={`corner-dish-name-arc${item.name.length > 24 ? ' corner-dish-name-arc--long' : ''}`}
            viewBox="0 0 100 100"
            ref={arcRef}
            aria-hidden="true"
          >
            <defs>
              <path id={arcId} d="M7 50 A43 43 0 0 1 93 50" />
            </defs>
            <text>
              <textPath
                href={`#${arcId}`}
                startOffset="50%"
                textAnchor="middle"
              >
                {item.name}
              </textPath>
            </text>
          </svg>
          {priceLabel && (
            <span className="corner-dish-price-badge" ref={badgeRef} aria-hidden="true">
              {priceLabel}
            </span>
          )}
        </button>
      </div>
      {card}
    </>
  );
}
