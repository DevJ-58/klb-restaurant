import { TransitionLink } from '../components/transition/TransitionLink';
import { usePageMeta } from '../lib/usePageMeta';

export function NotFoundPage() {
  usePageMeta({
    title: 'Page introuvable — KLB Restaurant',
    description: 'La page demandée est introuvable.',
    path: window.location.pathname,
    robots: 'noindex, nofollow',
  });

  return (
    <section className="not-found-page" aria-labelledby="not-found-title">
      <p className="not-found-code" aria-hidden="true">404</p>
      <h1 id="not-found-title">Cette page n’existe pas.</h1>
      <p>Le lien a peut-être changé. Retrouvez l’accueil de KLB Restaurant.</p>
      <TransitionLink to="/" className="not-found-link">
        Retour à l’accueil
      </TransitionLink>
    </section>
  );
}
