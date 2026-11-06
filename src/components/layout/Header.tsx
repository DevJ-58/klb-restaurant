import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { MapPin, MessageCircle, Phone, X } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useLocation, useNavigate } from 'react-router-dom';
import { site } from '../../config/site';
import { getOpenStatus } from '../../lib/hours';
import { resumeLenis, stopLenis } from '../../lib/lenis';
import { prefersReducedMotion } from '../../lib/motion';
import { BrandLogo } from '../BrandLogo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { TransitionLink } from '../transition/TransitionLink';

const links = [
  { to: '/carte', label: 'La carte' },
  { to: '/ambiance', label: 'Ambiance' },
  { to: '/nous-trouver', label: 'Nous trouver' },
];

export function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLSpanElement>(null);
  const mobileLogoRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);
  const [clocheAnimating, setClocheAnimating] = useState(false);
  const [openStatus, setOpenStatus] = useState(getOpenStatus);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuOpenRef = useRef(menuOpen);
  const [headerHidden, setHeaderHidden] = useState(false);
  const headerLockedRef = useRef(false);
  const menuHistoryRef = useRef(false);
  const menuHistoryEntryRef = useRef<string | null>(null);
  const menuHistorySequenceRef = useRef(0);
  const navigationTimerRef = useRef<number | null>(null);
  const hasOpenedMenuRef = useRef(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  menuOpenRef.current = menuOpen;

  useEffect(() => {
    document.documentElement.style.setProperty('--header-offset', 'var(--header-h)');
    return () => {
      document.documentElement.style.removeProperty('--header-offset');
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY < 160) {
        setHeaderHidden(false);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setOpenStatus(getOpenStatus()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const onHeaderLock = (event: Event): void => {
      if (!(event instanceof CustomEvent) || typeof event.detail !== 'boolean') {
        return;
      }
      headerLockedRef.current = event.detail;
      setHeaderHidden(event.detail);
    };
    document.addEventListener('klb:header-lock', onHeaderLock);
    return () => document.removeEventListener('klb:header-lock', onHeaderLock);
  }, []);

  useEffect(() => {
    if (!headerRef.current) {
      return;
    }
    gsap.set(headerRef.current, { yPercent: headerHidden ? -100 : 0 });
  }, [headerHidden]);

  const { contextSafe } = useGSAP(
    () => {
      const duration = prefersReducedMotion() ? 0 : 0.3;
      const onScroll = contextSafe((): void => {
        const currentY = window.scrollY;
        setIsScrolled(currentY > 24);
        if (!menuOpenRef.current && headerRef.current) {
          gsap.to(headerRef.current, {
            yPercent: headerLockedRef.current || headerHidden ? -100 : 0,
            duration,
            ease: 'power4.out',
            overwrite: true,
          });
        }
      });

      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    },
    { scope: headerRef, dependencies: [menuOpen], revertOnUpdate: true },
  );

  useGSAP(
    () => {
      for (const logo of [logoRef.current, mobileLogoRef.current]) {
        if (!logo) {
          continue;
        }
        gsap.to(logo, {
          scale: isScrolled ? 44 / 56 : 1,
          duration: prefersReducedMotion() ? 0 : 0.25,
          ease: 'power4.out',
        });
      }
    },
    { scope: headerRef, dependencies: [isScrolled], revertOnUpdate: true },
  );

  useEffect(() => {
    if (!menuOpen) {
      setHeaderHidden(false);
    }
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      if (wasOpenRef.current) {
        burgerRef.current?.focus();
      }
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const computedPaddingRight = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0;
    const root = document.getElementById('root');
    const inertTargets = Array.from(root?.children ?? [])
      .filter(
        (element) =>
          element !== headerRef.current &&
          element !== menuRef.current &&
          element !== backdropRef.current,
      )
      .map((element) => {
        const target = element as HTMLElement;
        const wasInert = target.inert;
        target.inert = true;
        return { target, wasInert };
      });
    const headerBackground = Array.from(
      headerRef.current?.querySelectorAll<HTMLElement>('.desktop-nav, .mobile-logo') ?? [],
    ).map((target) => {
      const wasInert = target.inert;
      target.inert = true;
      return { target, wasInert };
    });

    stopLenis();
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${computedPaddingRight + scrollbarWidth}px`;
    }

    const firstItem =
      menuRef.current?.querySelector<HTMLElement>('.mobile-menu-navigation a[href]') ??
      menuRef.current?.querySelector<HTMLElement>('button:not([disabled])');
    const focusFrame = window.requestAnimationFrame(() => {
      firstItem?.focus({ preventScroll: true });
    });

    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab' || !menuRef.current) {
        return;
      }
      const focusable = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!menuRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    const onPopState = (): void => {
      if (
        !menuOpenRef.current ||
        !menuHistoryRef.current ||
        window.history.state?.klbMobileMenu === menuHistoryEntryRef.current
      ) {
        return;
      }
      menuHistoryRef.current = false;
      menuHistoryEntryRef.current = null;
      setMenuOpen(false);
    };
    const onResize = (): void => closeMenu();

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('popstate', onPopState);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.cancelAnimationFrame(focusFrame);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      inertTargets.forEach(({ target, wasInert }) => {
        target.inert = wasInert;
      });
      headerBackground.forEach(({ target, wasInert }) => {
        target.inert = wasInert;
      });
      resumeLenis();
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen && !hasOpenedMenuRef.current) {
      return;
    }
    if (menuOpen) {
      hasOpenedMenuRef.current = true;
    }
    setMenuAnimating(true);
    setClocheAnimating(true);
    const reducedMotion = prefersReducedMotion();
    const menuTimer = window.setTimeout(
      () => setMenuAnimating(false),
      reducedMotion ? 150 : menuOpen ? 550 : 350,
    );
    const clocheTimer = window.setTimeout(
      () => setClocheAnimating(false),
      reducedMotion ? 150 : 400,
    );
    return () => {
      window.clearTimeout(menuTimer);
      window.clearTimeout(clocheTimer);
    };
  }, [menuOpen]);

  useEffect(
    () => () => {
      if (navigationTimerRef.current !== null) {
        window.clearTimeout(navigationTimerRef.current);
      }
      if (menuHistoryRef.current) {
        menuHistoryRef.current = false;
        menuHistoryEntryRef.current = null;
        window.history.back();
      }
    },
    [],
  );

  const openMenu = (): void => {
    if (navigationTimerRef.current !== null) {
      window.clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
    const state =
      window.history.state && typeof window.history.state === 'object'
        ? window.history.state
        : {};
    const historyEntryId = `${Date.now()}-${++menuHistorySequenceRef.current}`;
    window.history.pushState({ ...state, klbMobileMenu: historyEntryId }, '');
    menuHistoryEntryRef.current = historyEntryId;
    menuHistoryRef.current = true;
    setMenuOpen(true);
  };

  const closeMenu = (): void => {
    dragCleanupRef.current?.();
    dragCleanupRef.current = null;
    menuRef.current?.style.removeProperty('transform');
    menuRef.current?.style.removeProperty('transition');
    if (menuHistoryRef.current) {
      menuHistoryRef.current = false;
      menuHistoryEntryRef.current = null;
      window.history.back();
    }
    setMenuOpen(false);
  };

  const startPanelDrag = (event: ReactPointerEvent<HTMLElement>): void => {
    if (event.button !== 0 || !menuRef.current) {
      return;
    }
    const startY = event.clientY;
    const startTime = performance.now();
    const panel = menuRef.current;
    panel.setPointerCapture(event.pointerId);
    panel.style.transition = 'none';

    const onMove = (moveEvent: PointerEvent): void => {
      if (moveEvent.pointerId !== event.pointerId) {
        return;
      }
      const distance = Math.max(0, moveEvent.clientY - startY);
      const resistedDistance = distance / (1 + distance / panel.clientHeight);
      panel.style.transform = `translate3d(0, ${resistedDistance}px, 0)`;
    };
    const cleanup = (): void => {
      panel.removeEventListener('pointermove', onMove);
      panel.removeEventListener('pointerup', finishDrag);
      panel.removeEventListener('pointercancel', finishDrag);
      panel.style.removeProperty('transition');
      dragCleanupRef.current = null;
    };
    const finishDrag = (endEvent: PointerEvent): void => {
      if (endEvent.pointerId !== event.pointerId) {
        return;
      }
      cleanup();
      const distance = Math.max(0, endEvent.clientY - startY);
      const velocity = distance / Math.max(1, performance.now() - startTime);
      if (distance > panel.clientHeight * 0.25 || velocity > 0.7) {
        closeMenu();
      } else {
        panel.style.removeProperty('transform');
      }
    };

    panel.addEventListener('pointermove', onMove);
    panel.addEventListener('pointerup', finishDrag);
    panel.addEventListener('pointercancel', finishDrag);
    dragCleanupRef.current = cleanup;
  };

  const renderLink = (link: (typeof links)[number], index = 0, mobile = false) => (
    <TransitionLink
      className={`header-link${mobile ? ' mobile-menu-link' : ''}`}
      key={link.to}
      to={link.to}
      aria-current={location.pathname === link.to ? 'page' : undefined}
      style={mobile ? ({ '--menu-index': index } as CSSProperties) : undefined}
      onClick={
        mobile
          ? (event) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              ) {
                closeMenu();
                return;
              }
              event.preventDefault();
              closeMenu();
              navigationTimerRef.current = window.setTimeout(() => {
                if (location.pathname !== link.to) {
                  navigate(link.to);
                }
                navigationTimerRef.current = null;
              }, 300);
            }
          : undefined
      }
    >
      {mobile ? (
        <>
          <span className="mobile-menu-link-marker" aria-hidden="true" />
          <span className="mobile-menu-link-mask">
            <span className="mobile-menu-link-text">{link.label}</span>
          </span>
        </>
      ) : (
        link.label
      )}
    </TransitionLink>
  );

  return (
    <>
      <header
        className={`site-header${isScrolled ? ' site-header--scrolled' : ''}${menuOpen ? ' site-header--menu-open' : ''}${headerHidden ? ' site-header--hidden' : ''}`}
        ref={headerRef}
      >
        <nav className="desktop-nav" aria-label="Navigation principale">
          <div className="desktop-nav-half desktop-nav-half--left">
            {renderLink(links[0])}
            {renderLink(links[1])}
          </div>
          <TransitionLink className="header-logo" to="/" aria-label="KLB Restaurant, accueil">
            <span className="header-logo-image" ref={logoRef}>
              <BrandLogo />
            </span>
          </TransitionLink>
          <div className="desktop-nav-half desktop-nav-half--right">
            {renderLink(links[2], 2)}
            <ThemeToggle />
            <a className="header-order" href={site.whatsappLink()} target="_blank" rel="noreferrer">
              Commander
            </a>
          </div>
        </nav>

        <div className="mobile-header">
          <TransitionLink className="mobile-logo" to="/" aria-label="KLB Restaurant, accueil">
            <span className="mobile-logo-image" ref={mobileLogoRef}>
              <BrandLogo />
            </span>
          </TransitionLink>
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            aria-controls="header-mobile-menu"
            ref={burgerRef}
            onClick={() => (menuOpen ? closeMenu() : openMenu())}
          >
            <svg className="mobile-cloche" viewBox="0 0 48 44" aria-hidden="true">
              <g className={`mobile-cloche-dome${menuOpen ? ' is-raised' : ''}${clocheAnimating ? ' is-animating' : ''}`}>
                <path d="M12 30c.5-9 4.7-15.5 10.2-18.2a4 4 0 0 1 3.6 0C31.3 14.5 35.5 21 36 30H12Z" />
                <path d="M21 9a3 3 0 0 1 6 0v1h-6V9Z" />
              </g>
              <path className="mobile-cloche-base" d="M9 33h30v3H9z" />
              <path className="mobile-cloche-base" d="M13 38h22" />
            </svg>
          </button>
        </div>
      </header>
      <div
        className={`mobile-menu-backdrop${menuOpen ? ' is-open' : ''}${menuAnimating ? ' is-animating' : ''}`}
        aria-hidden="true"
        ref={backdropRef}
        onClick={closeMenu}
      />
      <section
        className={`mobile-menu${menuOpen ? ' is-open' : ''}${menuAnimating ? ' is-animating' : ''}`}
        id="header-mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal={menuOpen ? true : undefined}
        aria-label="Menu principal"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('.mobile-menu-drag-handle')) {
            startPanelDrag(event);
          }
        }}
      >
        <div className="mobile-menu-top">
          <div className="mobile-menu-drag-handle" aria-hidden="true">
            <span />
          </div>
          <button className="mobile-menu-close" type="button" aria-label="Fermer le menu" onClick={closeMenu}>
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <nav className="mobile-menu-navigation" aria-label="Navigation principale">
          {links.map((link, index) => renderLink(link, index, true))}
          <a
            className="header-order mobile-menu-link"
            href={site.whatsappLink()}
            target="_blank"
            rel="noreferrer"
            style={{ '--menu-index': links.length } as CSSProperties}
            onClick={closeMenu}
          >
            <span className="mobile-menu-link-marker" aria-hidden="true" />
            <span className="mobile-menu-link-mask">
              <span className="mobile-menu-link-text">Commander</span>
            </span>
          </a>
        </nav>
        <div className="mobile-menu-footer">
          <ThemeToggle />
          <div className="mobile-menu-actions" aria-label="Actions rapides">
            {site.phone && site.phoneLink && (
              <a
                className="mobile-menu-action"
                href={site.phoneLink}
                aria-label="Appeler"
                onClick={closeMenu}
              >
                <Phone aria-hidden="true" size={19} />
                <span>Appeler</span>
              </a>
            )}
            {site.phone && (
              <a
                className="mobile-menu-action"
                href={site.whatsappLink()}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                onClick={closeMenu}
              >
                <MessageCircle aria-hidden="true" size={19} />
                <span>WhatsApp</span>
              </a>
            )}
            {site.googleMapsUrl && (
              <a
                className="mobile-menu-action"
                href={site.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Itinéraire"
                onClick={closeMenu}
              >
                <MapPin aria-hidden="true" size={19} />
                <span>Itinéraire</span>
              </a>
            )}
          </div>
          {openStatus.isOpen && (
            <span className="mobile-menu-open-status">
              <span aria-hidden="true" />
              Ouvert maintenant
            </span>
          )}
        </div>
      </section>
    </>
  );
}
