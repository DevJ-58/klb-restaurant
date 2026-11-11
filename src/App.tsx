import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { IntroProvider } from './components/loader/Loader';
import { TransitionProvider } from './components/transition/TransitionProvider';
import { NotFoundPage } from './pages/NotFoundPage';

const Carte = lazy(() => import('./pages/Carte').then(({ Carte: page }) => ({ default: page })));
const AmbiancePage = lazy(() =>
  import('./pages/AmbiancePage').then(({ AmbiancePage: page }) => ({ default: page })),
);
const FindUsPage = lazy(() =>
  import('./pages/FindUsPage').then(({ FindUsPage: page }) => ({ default: page })),
);
const HomePage = lazy(() =>
  import('./pages/HomePage').then(({ HomePage: page }) => ({ default: page })),
);

function RouteSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      {children}
    </Suspense>
  );
}

function RouteLoadingFallback() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 150);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="route-loading" role="status">
      <span className="route-loading__sr">Chargement de la page</span>
      <svg className="route-loading__bell" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M10 31c0-12 6-20 14-20s14 8 14 20M7 33h34M20 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    </div>
  );
}

export function App() {
  useEffect(() => {
    window.__klbReady = true;
    window.dispatchEvent(new Event('klb:ready'));
  }, []);

  return (
    <BrowserRouter>
      <IntroProvider>
        <TransitionProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<RouteSuspense><HomePage /></RouteSuspense>} />
              <Route path="carte" element={<RouteSuspense><Carte /></RouteSuspense>} />
              <Route path="ambiance" element={<RouteSuspense><AmbiancePage /></RouteSuspense>} />
              <Route path="nous-trouver" element={<RouteSuspense><FindUsPage /></RouteSuspense>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </TransitionProvider>
      </IntroProvider>
    </BrowserRouter>
  );
}
