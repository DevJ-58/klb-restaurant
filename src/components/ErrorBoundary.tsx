import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Erreur inattendue pendant le rendu de la page.', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="route-error" role="alert" aria-labelledby="route-error-title">
          <h1 id="route-error-title">Une erreur est survenue.</h1>
          <p>La page n’a pas pu être affichée. Rechargez-la pour réessayer.</p>
          <button type="button" onClick={() => window.location.reload()}>
            Recharger la page
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
