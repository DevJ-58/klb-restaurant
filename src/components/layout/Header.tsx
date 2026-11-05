import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useLocation } from 'react-router-dom';
import { site } from '../../config/site';
import { resumeLenis, stopLenis } from '../../lib/lenis';
import { prefersReducedMotion } from '../../lib/motion';
import { BrandLogo } from '../BrandLogo';
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
  const burgerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuOpenRef = useRef(menuOpen);
  const [headerHidden, setHeaderHidden] = useState(false);
  const headerLockedRef = useRef(false);
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

  useGSAP(
    () => {
      if (!menuOpen || !menuRef.current || prefersReducedMotion()) {
        return;
      }
      const menuLinks = menuRef.current.querySelectorAll<HTMLElement>('.mobile-menu-link');
      gsap.from(menuLinks, {
        y: 30,
        opacity: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: 'power4.out',
      });
    },
    { scope: menuRef, dependencies: [menuOpen], revertOnUpdate: true },
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
    const previousOverflow = document.body.style.overflow;
    stopLenis();
    document.body.style.overflow = 'hidden';
    const firstItem = menuRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    firstItem?.focus();

    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
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
        burgerRef.current?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      resumeLenis();
    };
  }, [menuOpen]);

  const renderLink = (link: (typeof links)[number], mobile = false) => (
    <TransitionLink
      className={`header-link${mobile ? ' mobile-menu-link' : ''}`}
      key={link.to}
      to={link.to}
      aria-current={location.pathname === link.to ? 'page' : undefined}
      onClick={mobile ? () => setMenuOpen(false) : undefined}
    >
      {link.label}
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
            {renderLink(links[2])}
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
            onClick={() => setMenuOpen((open) => !open)}
            ref={burgerRef}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </header>
      <div
        className="mobile-menu"
        id="header-mobile-menu"
        ref={menuRef}
        hidden={!menuOpen}
        aria-label="Navigation principale"
      >
        {links.map((link) => renderLink(link, true))}
        <a
          className="header-order mobile-menu-link"
          href={site.whatsappLink()}
          target="_blank"
          rel="noreferrer"
          onClick={() => setMenuOpen(false)}
        >
          Commander
        </a>
      </div>
    </>
  );
}
