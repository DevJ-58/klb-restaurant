import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/manrope';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { App } from './App';
import { startLenis } from './lib/lenis';
import './styles/tokens.css';
import './styles/touches.css';
import './styles/nous-trouver.css';
import './styles/tiles.css';
import './styles/theme.css';
import './styles/theme-light.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Élément racine #root introuvable.');
}

if (import.meta.env.DEV) {
  (window as typeof window & { ScrollTrigger?: typeof ScrollTrigger }).ScrollTrigger = ScrollTrigger;
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

startLenis();
