import { lazy, Suspense, type ReactNode } from 'react';
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
    <Suspense fallback={<div className="route-loading" role="status">Chargement…</div>}>
      {children}
    </Suspense>
  );
}

export function App() {
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
