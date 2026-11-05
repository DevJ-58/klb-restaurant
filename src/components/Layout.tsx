import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Outlet, useLocation } from 'react-router-dom';
import { ActionBar } from './layout/ActionBar';
import { Header } from './layout/Header';
import { Loader } from './loader/Loader';
import { Cursor } from './ui/Cursor';
import { Footer } from './layout/Footer';
import { CursorLight } from './effects/CursorLight';
import { MagneticButtons } from './effects/MagneticButtons';
import { ErrorBoundary } from './ErrorBoundary';

export function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <Loader />
      <Cursor />
      <CursorLight />
      <MagneticButtons />
      <Header />
      <main className="page-content" id="contenu" tabIndex={-1}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <ActionBar />
    </>
  );
}
