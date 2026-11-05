import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { MapPin, MessageCircle, Phone, X } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { site } from '../config/site';
import { ambianceCopy, ambiancePhotos } from '../data/ambiance.js';
import { TransitionLink } from '../components/transition/TransitionLink';
import { usePageTransition } from '../components/transition/TransitionProvider';
import { getOpenStatus } from '../lib/hours';
import { resumeLenis, stopLenis } from '../lib/lenis';
import { prefersReducedMotion } from '../lib/motion';
import './AmbiancePage.css';

gsap.registerPlugin(Flip, ScrollTrigger);

type AmbiancePhoto = (typeof ambiancePhotos)[number];
type PhotoId = AmbiancePhoto['id'];

const galleryPhotos = ambiancePhotos.filter((photo) => photo.id !== 'facade');
function getLocationPhoto(): AmbiancePhoto {
  const photo = ambiancePhotos.find((item) => item.id === 'facade');
  if (!photo) {
    throw new Error('La photo de façade est absente de src/data/ambiance.js.');
  }
  return photo;
}

const locationPhoto = getLocationPhoto();

function BellFallback({ label, alt }: { label: string; alt: string }) {
  return (
    <span className="evening-photo-fallback" role="img" aria-label={alt}>
      <svg viewBox="0 0 120 96" focusable="false" aria-hidden="true">
        <path d="M22 66h76M31 61c0-22 12-38 29-38s29 16 29 38M52 22c0-7 3-11 8-11s8 4 8 11" />
        <path d="M16 72c2 6 7 9 14 9h60c7 0 12-3 14-9" />
      </svg>
      <span>{label}</span>
    </span>
  );
}

function PhotoFrame({
  photo,
  className = '',
  loading = 'lazy',
  flipTarget = false,
  onFailure,
}: {
  photo: AmbiancePhoto;
  className?: string;
  loading?: 'eager' | 'lazy';
  flipTarget?: boolean;
  onFailure: (id: PhotoId) => void;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`evening-photo ${className}`.trim()}
      style={{ aspectRatio: photo.ratio }}
      data-photo-id={photo.id}
      data-flip-id={flipTarget ? `gallery-${photo.id}` : undefined}
    >
      {failed ? (
        <BellFallback label={photo.legende} alt={photo.alt} />
      ) : (
        <img
          src={photo.src}
          alt={photo.alt}
          loading={loading}
          decoding="async"
          onError={() => {
            setFailed(true);
            onFailure(photo.id);
          }}
        />
      )}
    </span>
  );
}

function PhotoButton({
  photo,
  className,
  onOpen,
  onFailure,
}: {
  photo: AmbiancePhoto;
  className: string;
  onOpen: (photo: AmbiancePhoto, frame: HTMLElement, button: HTMLButtonElement) => void;
  onFailure: (id: PhotoId) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      className={`evening-photo-button ${className}`}
      type="button"
      aria-label={`Agrandir : ${photo.legende}`}
      data-cursor="Voir"
      onClick={() => {
        const button = buttonRef.current;
        const frame = button?.querySelector<HTMLElement>('.evening-photo');
        if (button && frame) {
          onOpen(photo, frame, button);
        }
      }}
      ref={buttonRef}
    >
      <PhotoFrame photo={photo} flipTarget onFailure={onFailure} />
    </button>
  );
}

type LightboxProps = {
  photos: AmbiancePhoto[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onFailure: (id: PhotoId) => void;
};

function Lightbox({
  photos,
  activeIndex,
  onClose,
  onNavigate,
  onFailure,
}: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);
  const latest = useRef({ activeIndex, onClose, onNavigate, photos });
  const photo = photos[activeIndex];
  const [failed, setFailed] = useState(false);
  const isOpen = Boolean(photo);

  latest.current = { activeIndex, onClose, onNavigate, photos };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    stopLenis();
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent): void => {
      const current = latest.current;
      if (event.key === 'Escape') {
        event.preventDefault();
        current.onClose();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        current.onNavigate(
          (current.activeIndex - 1 + current.photos.length) % current.photos.length,
        );
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        current.onNavigate((current.activeIndex + 1) % current.photos.length);
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      resumeLenis();
    };
  }, [isOpen]);

  useEffect(() => {
    setFailed(false);
  }, [photo?.id]);

  if (!photo) {
    return null;
  }

  const moveBy = (step: number): void => {
    onNavigate((activeIndex + step + photos.length) % photos.length);
  };

  return createPortal(
    <div
      className="evening-lightbox-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="evening-lightbox"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evening-lightbox-caption"
        ref={dialogRef}
        onTouchStart={(event) => {
          touchStartX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const endX = event.changedTouches[0]?.clientX;
          if (touchStartX.current !== null && endX !== undefined) {
            const distance = endX - touchStartX.current;
            if (Math.abs(distance) > 48) {
              moveBy(distance > 0 ? -1 : 1);
            }
          }
          touchStartX.current = null;
        }}
      >
        <button
          className="evening-lightbox-close"
          type="button"
          onClick={onClose}
          aria-label="Fermer la photo"
          ref={closeRef}
        >
          <X aria-hidden="true" size={24} />
        </button>
        <button
          className="evening-lightbox-arrow evening-lightbox-arrow--previous"
          type="button"
          onClick={() => moveBy(-1)}
          aria-label="Photo précédente"
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div
          className="evening-lightbox-photo"
          data-flip-id={`gallery-${photo.id}`}
        >
          {failed ? (
            <BellFallback label={photo.legende} alt={photo.alt} />
          ) : (
            <img
              src={photo.src}
              alt={photo.alt}
              onError={() => {
                setFailed(true);
                onFailure(photo.id);
              }}
            />
          )}
        </div>
        <div className="evening-lightbox-caption">
          <p id="evening-lightbox-caption">{photo.legende}</p>
          <span aria-live="polite">
            {activeIndex + 1} / {photos.length}
          </span>
        </div>
        <button
          className="evening-lightbox-arrow evening-lightbox-arrow--next"
          type="button"
          onClick={() => moveBy(1)}
          aria-label="Photo suivante"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}

function line(text: string) {
  return (
    <span className="evening-line-mask">
      <span>{text}</span>
    </span>
  );
}

export function AmbiancePage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const counterRef = useRef<HTMLElement>(null);
  const roomRef = useRef<HTMLElement>(null);
  const tableRef = useRef<HTMLElement>(null);
  const facadeRef = useRef<HTMLElement>(null);
  const torchRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const flipStateRef = useRef<ReturnType<typeof Flip.getState> | null>(null);
  const [failedPhotoIds, setFailedPhotoIds] = useState<PhotoId[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<PhotoId | null>(null);
  const [openStatus] = useState(getOpenStatus);
  const [reducedMotion] = useState(prefersReducedMotion);
  const [entryRevealVisible, setEntryRevealVisible] = useState(!reducedMotion);
  const { isTransitioning } = usePageTransition();
  const visibleGalleryPhotos = galleryPhotos.filter(
    (photo) =>
      !(
        photo.optionnel &&
        failedPhotoIds.includes(photo.id) &&
        activePhotoId !== photo.id
      ),
  );
  const activeIndex = visibleGalleryPhotos.findIndex((photo) => photo.id === activePhotoId);
  const heroPhoto = galleryPhotos[0];
  const photoStyle = {
    '--evening-photo': heroPhoto ? `url("${heroPhoto.src}")` : 'none',
  } as CSSProperties;

  useGSAP(
    () => {
      const page = pageRef.current;
      const hero = heroRef.current;
      const counter = counterRef.current;
      const room = roomRef.current;
      const table = tableRef.current;
      const facade = facadeRef.current;
      if (!page || !hero || !counter || !room || !table || !facade) {
        return;
      }

      const media = gsap.matchMedia();
      media.add(
        {
          desktop: '(min-width: 768px)',
          reduce: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const conditions = context.conditions as
            | { desktop?: boolean; reduce?: boolean }
            | undefined;
          if (conditions?.reduce) {
            return;
          }

          const desktop = Boolean(conditions?.desktop);
          const heroWord = page.querySelector<HTMLElement>('.evening-word');
          const heroCopy = gsap.utils.toArray<HTMLElement>(
            '.evening-hero-copy .evening-line-mask > span',
            hero,
          );
          const scrollCue = page.querySelector<HTMLElement>('.evening-scroll-cue');
          const counterFrame = counter.querySelector<HTMLElement>('.evening-counter-frame');
          const counterImage = counterFrame?.querySelector<HTMLElement>('img');
          const counterCaption = counter.querySelector<HTMLElement>('.evening-counter-caption');
          const roomOutline = room.querySelector<HTMLElement>('.evening-room-outline');
          const roomFigures = gsap.utils.toArray<HTMLElement>('.evening-room-figure', room);
          const track = table.querySelector<HTMLElement>('.evening-table-track');
          const detail = table.querySelector<HTMLElement>(
            '.evening-table-card--detail-table .evening-photo',
          );
          const facadeImage = facade.querySelector<HTMLElement>('.evening-facade-visual img');
          const facadeGlow = facade.querySelector<HTMLElement>('.evening-facade-glow');
          const exitLink = page.querySelector<HTMLElement>('.evening-exit-link');
          const nightLayer = page.querySelector<HTMLElement>('.evening-night-layer');

          if (nightLayer) {
            gsap.fromTo(
              nightLayer,
              { opacity: 0 },
              {
                opacity: 0.72,
                ease: 'none',
                scrollTrigger: {
                  trigger: page,
                  start: 'top top',
                  end: 'bottom bottom',
                  scrub: 1,
                },
              },
            );
          }
          gsap.utils.toArray<HTMLElement>('.evening-halo', page).forEach((halo) => {
            const chapter = halo.parentElement;
            if (!chapter) {
              return;
            }
            gsap.fromTo(
              halo,
              { opacity: 0 },
              {
                opacity: 0.78,
                ease: 'none',
                scrollTrigger: {
                  trigger: chapter,
                  start: 'top 80%',
                  end: 'center 30%',
                  scrub: 0.9,
                },
              },
            );
          });

          if (desktop) {
            if (heroWord && scrollCue) {
              const entrance = gsap.timeline({
                scrollTrigger: {
                  trigger: hero,
                  start: 'top top',
                  end: '+=175%',
                  pin: true,
                  scrub: 0.9,
                  anticipatePin: 1,
                },
              });
              entrance
                .to(scrollCue, { y: 18, opacity: 0, ease: 'none' }, 0)
                .to(heroWord, { scale: 13, opacity: 0, ease: 'power2.in' }, 0.05)
                .to(page.querySelector('.evening-hero-image'), { opacity: 0.85, ease: 'none' }, 0.15)
                .fromTo(
                  heroCopy,
                  { yPercent: 110 },
                  { yPercent: 0, duration: 0.24, stagger: 0.08, ease: 'power4.out' },
                  0.76,
                );
            }

            if (counterFrame) {
              gsap.fromTo(
                counterFrame,
                { clipPath: 'inset(50% 50% 50% 50% round 50%)' },
                {
                  clipPath: 'inset(0% round 1.5rem)',
                  ease: 'none',
                  scrollTrigger: {
                    trigger: counter,
                    start: 'top top',
                    end: '+=115%',
                    scrub: 0.9,
                  },
                },
              );
            }
            if (counterImage) {
              gsap.fromTo(
                counterImage,
                { scale: 1.25 },
                {
                  scale: 1,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: counter,
                    start: 'top top',
                    end: '+=115%',
                    scrub: 0.9,
                  },
                },
              );
            }
            if (counterCaption) {
              gsap.fromTo(
                counterCaption,
                { xPercent: -18, opacity: 0.3 },
                {
                  xPercent: 0,
                  opacity: 1,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: counter,
                    start: 'top 80%',
                    end: 'center center',
                    scrub: 0.8,
                  },
                },
              );
            }

            if (roomOutline) {
              gsap.to(roomOutline, {
                xPercent: -32,
                ease: 'none',
                scrollTrigger: {
                  trigger: room,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 0.8,
                  onUpdate: (self) => {
                    gsap.set(
                      roomOutline,
                      { skewX: gsap.utils.clamp(-8, 8, self.getVelocity() / 500) },
                    );
                  },
                },
              });
            }

            roomFigures.forEach((figure, index) => {
              const frame = figure.querySelector<HTMLElement>('.evening-room-photo');
              const image = frame?.querySelector<HTMLElement>('img');
              if (!frame) {
                return;
              }
              gsap
                .timeline({
                  scrollTrigger: {
                    trigger: figure,
                    start: 'top 85%',
                    end: 'bottom 20%',
                    scrub: 0.8,
                  },
                })
                .to(
                  frame,
                  {
                    clipPath:
                      index === 0
                        ? 'inset(0% round 50%)'
                        : 'inset(0% round 50% 30%)',
                    ease: 'none',
                  },
                  0,
                )
                .to(frame, { clipPath: 'inset(0% round 0.75rem)', ease: 'none' });
              if (image) {
                gsap.fromTo(
                  image,
                  { scale: 1.3, yPercent: index === 0 ? 8 : -8 },
                  {
                    scale: 1,
                    yPercent: index === 0 ? -8 : 8,
                    ease: 'none',
                    scrollTrigger: {
                      trigger: figure,
                      start: 'top bottom',
                      end: 'bottom top',
                      scrub: 0.9,
                    },
                  },
                );
              }
            });

            if (track) {
              const horizontal = gsap.timeline({
                scrollTrigger: {
                  trigger: table,
                  start: 'top top',
                  end: () =>
                    `+=${Math.max(900, track.scrollWidth - window.innerWidth + window.innerWidth * 0.8)}`,
                  pin: true,
                  scrub: 0.9,
                  invalidateOnRefresh: true,
                },
              });
              horizontal.to(track, {
                x: () => -Math.max(0, track.scrollWidth - window.innerWidth + 32),
                ease: 'none',
              });
              gsap.utils
                .toArray<HTMLElement>('.evening-table-card', track)
                .forEach((card, index) => {
                  horizontal.to(
                    card,
                    {
                      x: (index - 1) * 110,
                      y: index % 2 === 0 ? -18 : 18,
                      ease: 'none',
                    },
                    0,
                  );
                });
              if (detail) {
                horizontal.to(
                  detail,
                  { scale: 5, transformOrigin: '50% 50%', ease: 'power2.in' },
                  0.82,
                );
              }
            }

            if (facadeImage && facadeGlow) {
              gsap.fromTo(
                facadeImage,
                { filter: 'brightness(0.35) saturate(0.35)' },
                {
                  filter: 'brightness(1) saturate(1)',
                  ease: 'none',
                  scrollTrigger: {
                    trigger: facade,
                    start: 'top 75%',
                    end: 'center center',
                    scrub: 0.8,
                  },
                },
              );
              gsap.fromTo(
                facadeGlow,
                { opacity: 0 },
                {
                  opacity: 0.75,
                  ease: 'none',
                  scrollTrigger: {
                    trigger: facade,
                    start: 'top 70%',
                    end: 'center center',
                    scrub: 0.8,
                  },
                },
              );
            }

            if (exitLink) {
              gsap.to(exitLink, {
                y: -8,
                duration: 2.4,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true,
              });
            }
          } else {
            gsap.utils
              .toArray<HTMLElement>('[data-simple-reveal]', page)
              .forEach((element) => {
                gsap.fromTo(
                  element,
                  { clipPath: 'inset(12% 0 0 0)', opacity: 0.72 },
                  {
                    clipPath: 'inset(0% 0 0 0)',
                    opacity: 1,
                    duration: 0.7,
                    ease: 'power4.out',
                    scrollTrigger: {
                      trigger: element,
                      start: 'top 88%',
                      once: true,
                    },
                  },
                );
              });
          }

        },
      );

      const cue = page.querySelector<HTMLElement>('.evening-scroll-cue');
      if (!prefersReducedMotion() && cue) {
        gsap.to(cue, {
          y: 10,
          duration: 0.8,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      ScrollTrigger.refresh();
      return () => media.revert();
    },
    { scope: pageRef, revertOnUpdate: true },
  );

  useGSAP(
    () => {
      const reveal = pageRef.current?.querySelector<HTMLElement>('.evening-entry-reveal');
      if (!entryRevealVisible || isTransitioning || !reveal) {
        return;
      }
      if (prefersReducedMotion()) {
        setEntryRevealVisible(false);
        return;
      }
      const timeline = gsap.timeline({ onComplete: () => setEntryRevealVisible(false) });
      timeline
        .fromTo(
          reveal,
          { clipPath: 'circle(0% at 50% 50%)' },
          { clipPath: 'circle(150% at 50% 50%)', duration: 0.5, ease: 'expo.out' },
        )
        .to(reveal, { opacity: 0, duration: 0.2, ease: 'power2.out' });
    },
    {
      scope: pageRef,
      dependencies: [entryRevealVisible, isTransitioning],
      revertOnUpdate: true,
    },
  );

  useGSAP(
    () => {
      const page = pageRef.current;
      const facadeVisual = facadeRef.current?.querySelector<HTMLElement>('.evening-facade-visual');
      const torch = torchRef.current;
      const torchImage = torch?.querySelector<HTMLImageElement>('img');
      if (
        !page ||
        !facadeVisual ||
        !torch ||
        !torchImage ||
        reducedMotion ||
        !window.matchMedia('(pointer: fine)').matches
      ) {
        return;
      }

      const moveX = gsap.quickTo(torch, 'x', { duration: 0.22, ease: 'power3.out' });
      const moveY = gsap.quickTo(torch, 'y', { duration: 0.22, ease: 'power3.out' });
      const imageX = gsap.quickTo(torchImage, 'x', { duration: 0.22, ease: 'power3.out' });
      const imageY = gsap.quickTo(torchImage, 'y', { duration: 0.22, ease: 'power3.out' });
      const showTorch = (): void => page.classList.add('is-torch-active');
      const hideTorch = (): void => page.classList.remove('is-torch-active');
      const resizeTorch = (): void => {
        const bounds = facadeVisual.getBoundingClientRect();
        torchImage.style.width = `${bounds.width}px`;
        torchImage.style.height = `${bounds.height}px`;
      };
      const onMove = (event: PointerEvent): void => {
        const bounds = facadeVisual.getBoundingClientRect();
        const size = torch.getBoundingClientRect().width;
        const x = event.clientX - bounds.left - size / 2;
        const y = event.clientY - bounds.top - size / 2;
        moveX(x);
        moveY(y);
        imageX(-x);
        imageY(-y);
      };

      const resizeObserver = new ResizeObserver(resizeTorch);
      resizeObserver.observe(facadeVisual);
      resizeTorch();
      facadeVisual.addEventListener('pointerenter', showTorch);
      facadeVisual.addEventListener('pointermove', onMove);
      facadeVisual.addEventListener('pointerleave', hideTorch);
      return () => {
        resizeObserver.disconnect();
        facadeVisual.removeEventListener('pointerenter', showTorch);
        facadeVisual.removeEventListener('pointermove', onMove);
        facadeVisual.removeEventListener('pointerleave', hideTorch);
        page.classList.remove('is-torch-active');
        torchImage.style.removeProperty('width');
        torchImage.style.removeProperty('height');
      };
    },
    { scope: pageRef, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  useGSAP(
    () => {
      if (reducedMotion || window.matchMedia('(pointer: coarse)').matches) {
        return;
      }
      const links = gsap.utils.toArray<HTMLElement>('.evening-magnetic', pageRef.current);
      const cleanups = links.map((link) => {
        const moveX = gsap.quickTo(link, 'x', { duration: 0.25, ease: 'power3.out' });
        const moveY = gsap.quickTo(link, 'y', { duration: 0.25, ease: 'power3.out' });
        const onMove = (event: PointerEvent): void => {
          if (event.pointerType === 'touch') {
            return;
          }
          const bounds = link.getBoundingClientRect();
          moveX((event.clientX - bounds.left - bounds.width / 2) * 0.12);
          moveY((event.clientY - bounds.top - bounds.height / 2) * 0.12);
        };
        const onLeave = (): void => {
          gsap.to(link, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.45)' });
        };
        link.addEventListener('pointermove', onMove);
        link.addEventListener('pointerleave', onLeave);
        return () => {
          link.removeEventListener('pointermove', onMove);
          link.removeEventListener('pointerleave', onLeave);
        };
      });
      return () => cleanups.forEach((cleanup) => cleanup());
    },
    { scope: pageRef, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;
    document.title = 'L’ambiance KLB — KLB Restaurant';
    if (description) {
      description.content = `Découvrez l’ambiance de KLB Restaurant à ${site.city}.`;
    }

    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) {
        description.content = previousDescription;
      }
    };
  }, []);

  useEffect(() => {
    const footer = document.querySelector<HTMLElement>('.site-footer');
    const actionBar = document.querySelector<HTMLElement>('[data-actionbar]');
    if (!footer || !actionBar) {
      return;
    }

    actionBar.dataset.footerMode = 'true';
    const observer = new IntersectionObserver(([entry]) => {
      actionBar.toggleAttribute('data-footer-visible', entry?.isIntersecting ?? false);
    });
    observer.observe(footer);

    return () => {
      observer.disconnect();
      delete actionBar.dataset.footerMode;
      actionBar.removeAttribute('data-footer-visible');
    };
  }, []);

  useEffect(() => {
    let active = true;
    let refreshFrame = 0;
    const images = Array.from(pageRef.current?.querySelectorAll('img') ?? []);
    const imagesReady = Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) {
              resolve();
              return;
            }
            image.addEventListener('load', () => resolve(), { once: true });
            image.addEventListener('error', () => resolve(), { once: true });
          }),
      ),
    );

    void Promise.all([document.fonts.ready, imagesReady]).then(() => {
      if (active) {
        refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
      }
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(refreshFrame);
    };
  }, [failedPhotoIds]);

  const markImageFailed = (id: PhotoId): void => {
    setFailedPhotoIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const handleOpen = (
    photo: AmbiancePhoto,
    frame: HTMLElement,
    button: HTMLButtonElement,
  ): void => {
    returnFocusRef.current = button;
    flipStateRef.current = reducedMotion ? null : Flip.getState(frame);
    setActivePhotoId(photo.id);
  };

  useLayoutEffect(() => {
    if (!activePhotoId || activeIndex < 0 || !flipStateRef.current) {
      return;
    }
    const photo = visibleGalleryPhotos[activeIndex];
    if (!photo) {
      return;
    }
    const state = flipStateRef.current;
    flipStateRef.current = null;
    const frame = document.querySelector<HTMLElement>(
      `.evening-lightbox-photo[data-flip-id="gallery-${photo.id}"]`,
    );
    if (frame) {
      Flip.from(state, {
        targets: frame,
        duration: 0.7,
        ease: 'power4.out',
        absolute: true,
        scale: true,
      });
    }
  }, [activeIndex, activePhotoId, visibleGalleryPhotos]);

  const handleClose = (): void => {
    const frame = document.querySelector<HTMLElement>('.evening-lightbox-photo');
    const state = !reducedMotion && frame ? Flip.getState(frame) : null;
    const id = activePhotoId;
    setActivePhotoId(null);
    window.requestAnimationFrame(() => {
      const target = id
        ? document.querySelector<HTMLElement>(
            `.evening-photo-button .evening-photo[data-photo-id="${id}"]`,
          )
        : null;
      if (state && target) {
        Flip.from(state, {
          targets: target,
          duration: 0.55,
          ease: 'power4.out',
          absolute: true,
          scale: true,
        });
      }
      returnFocusRef.current?.focus();
    });
  };

  const handleNavigate = (index: number): void => {
    const photo = visibleGalleryPhotos[index];
    if (photo) {
      setActivePhotoId(photo.id);
    }
  };

  const handleImageFailure = (id: PhotoId): void => {
    markImageFailed(id);
  };

  return (
    <div
      className="ambiance-page"
      data-comptoir-failed={failedPhotoIds.includes('comptoir') || undefined}
      ref={pageRef}
    >
      <div className="evening-night-layer" aria-hidden="true" />
      <section className="evening-chapter evening-hero" ref={heroRef} aria-labelledby="ambiance-title">
        <div className="evening-hero-image">
          {heroPhoto && (
            <PhotoFrame
              photo={heroPhoto}
              className="evening-photo--hero"
              loading="eager"
              onFailure={markImageFailed}
            />
          )}
        </div>
        <div className="evening-chapter-inner evening-hero-content" style={photoStyle}>
          <p className="evening-kicker">Morofé · Yamoussoukro</p>
          <h1 className="evening-word" id="ambiance-title" aria-label="L’ambiance KLB">
            AMBIANCE
          </h1>
          <div className="evening-hero-copy">
            <h2>{line('L’ambiance KLB')}</h2>
            <p>{line('Bonne cuisine, bonne ambiance.')}</p>
          </div>
        </div>
        <span className="evening-scroll-cue" aria-hidden="true" />
      </section>

      <section
        className="evening-chapter evening-counter"
        ref={counterRef}
        aria-labelledby="evening-counter-title"
      >
        <span className="evening-halo evening-halo--counter" aria-hidden="true" />
        <div className="evening-chapter-inner evening-counter-content">
          <p className="evening-kicker">02 · S’accouder</p>
          <h2 className="evening-heading" id="evening-counter-title">
            Le comptoir
          </h2>
          {galleryPhotos[0] && (
            <PhotoButton
              photo={galleryPhotos[0]}
              className="evening-counter-frame"
              onOpen={handleOpen}
              onFailure={handleImageFailure}
            />
          )}
          <p className="evening-counter-caption">On prend le temps.</p>
        </div>
      </section>

      <section className="evening-chapter evening-room" ref={roomRef} aria-labelledby="evening-room-title">
        <span className="evening-halo evening-halo--room" aria-hidden="true" />
        <span className="evening-room-outline" aria-hidden="true">
          LA SALLE
        </span>
        <div className="evening-chapter-inner evening-room-content">
          <h2 className="evening-heading" id="evening-room-title">
            La salle
          </h2>
          <p className="evening-room-copy">{ambianceCopy.introduction}</p>
          {galleryPhotos.slice(1, 3).map((photo) => (
            <figure className="evening-room-figure" key={photo.id} data-simple-reveal>
              <PhotoButton
                photo={photo}
                className="evening-room-photo"
                onOpen={handleOpen}
                onFailure={handleImageFailure}
              />
              <figcaption>{photo.legende}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section
        className="evening-chapter evening-table"
        ref={tableRef}
        aria-labelledby="evening-table-title"
      >
        <span className="evening-halo evening-halo--table" aria-hidden="true" />
        <div className="evening-table-heading">
          <div>
            <p className="evening-kicker">03 · Partager</p>
            <h2 className="evening-heading" id="evening-table-title">
              Autour de la table
            </h2>
          </div>
          <span className="evening-table-count" aria-label="Séquence 2 sur 3">
            02 / 03
          </span>
        </div>
        <div className="evening-table-track">
          {visibleGalleryPhotos.filter((photo) =>
            galleryPhotos.slice(3).some((item) => item.id === photo.id),
          ).map((photo) => (
            <figure
              className={`evening-table-card evening-table-card--${photo.id}`}
              key={photo.id}
              data-simple-reveal
            >
              <PhotoButton
                photo={photo}
                className="evening-table-photo"
                onOpen={handleOpen}
                onFailure={handleImageFailure}
              />
              <figcaption>{photo.legende}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="evening-chapter evening-facade" ref={facadeRef} aria-labelledby="evening-facade-title">
        <span className="evening-halo evening-halo--facade" aria-hidden="true" />
        <div className="evening-chapter-inner">
          <p className="evening-kicker">La nuit tombe</p>
          <h2 className="evening-heading" id="evening-facade-title">
            Encore un peu.
          </h2>
          <div className="evening-facade-layout">
            <div className="evening-facade-visual" data-cursor="Voir">
              <PhotoFrame photo={locationPhoto} onFailure={markImageFailed} />
              <div className="evening-facade-glow" aria-hidden="true" />
              {!failedPhotoIds.includes(locationPhoto.id) && (
                <div className="evening-torch" ref={torchRef} aria-hidden="true">
                  <img src={locationPhoto.src} alt="" />
                </div>
              )}
            </div>
            <div className="evening-location-copy">
              <p className="evening-address">
                <MapPin aria-hidden="true" size={20} />
                <span>{site.neighborhood}, {site.city}</span>
              </p>
              <div
                className={`evening-open-status${openStatus.isOpen ? ' is-open' : ' is-closed'}`}
                aria-live="polite"
              >
                <span className="evening-open-dot" aria-hidden="true" />
                <strong>{openStatus.isOpen ? 'Ouvert maintenant' : 'Fermé'}</strong>
                <span>{openStatus.message}</span>
              </div>
              <p className="evening-hours">
                Tous les jours, {site.openingHours.monday.opens.replace(':', ' h ')} –{' '}
                {site.openingHours.monday.closes.replace(':', ' h ')}
              </p>
              <nav className="evening-actions" aria-label="Contacter KLB">
                <a className="evening-magnetic" href={site.phoneLink}>
                  <Phone aria-hidden="true" size={18} />
                  Appeler
                </a>
                <a
                  className="evening-magnetic"
                  href={site.whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle aria-hidden="true" size={18} />
                  WhatsApp
                </a>
                <a
                  className="evening-magnetic"
                  href={site.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin aria-hidden="true" size={18} />
                  Itinéraire
                </a>
              </nav>
            </div>
          </div>
        </div>
      </section>

      <section className="evening-chapter evening-exit" aria-label="Voir la carte">
        <TransitionLink className="evening-exit-link evening-magnetic" to="/carte">
          <span>Voir la carte</span>
        </TransitionLink>
      </section>

      {entryRevealVisible && !reducedMotion && !isTransitioning && (
        <div className="evening-entry-reveal" aria-hidden="true" />
      )}
      {activeIndex >= 0 && (
        <Lightbox
          photos={visibleGalleryPhotos}
          activeIndex={activeIndex}
          onClose={handleClose}
          onNavigate={handleNavigate}
          onFailure={handleImageFailure}
        />
      )}
    </div>
  );
}
