import { useEffect } from 'react';
import { MapPin, MessageCircle, Phone } from 'lucide-react';
import { site } from '../../config/site';
import { formatBusinessHours } from '../../lib/hours';
import { BrandLogo } from '../BrandLogo';
import { TransitionLink } from '../transition/TransitionLink';

export function Footer() {
  useEffect(() => {
    const main = document.querySelector('main');
    const lastSection = main?.lastElementChild as HTMLElement | null;
    const domeColor = lastSection?.dataset.bgEnd ?? '#0B0806';
    const footer = document.querySelector<HTMLElement>('.site-footer');
    if (footer) {
      footer.style.setProperty('--footer-dome-bg', domeColor);
      footer.style.setProperty('--footer-dome-line', lastSection ? '#d7b15b' : 'transparent');
    }
  }, []);

  return (
    <footer className="site-footer" aria-label="Pied de page" data-surface="dark" style={{ ['--footer-dome-bg' as string]: '#0B0806', ['--footer-dome-line' as string]: '#d7b15b' }}>
      <div className="site-footer-inner" data-content>
        <TransitionLink className="footer-brand" to="/" aria-label="KLB Restaurant, accueil">
          <BrandLogo />
        </TransitionLink>
        <div className="footer-details">
          <address>
            <MapPin aria-hidden="true" size={18} />
            <span data-content>{site.neighborhood}, {site.city}</span>
          </address>
          <p>
            <span data-content>Horaires</span>
            <span data-content>{formatBusinessHours()}</span>
          </p>
          <nav className="footer-actions" aria-label="Nous contacter">
            <a href={site.phoneLink} data-content><Phone aria-hidden="true" size={18} /> Appeler</a>
            <a href={site.whatsappLink()} target="_blank" rel="noreferrer" data-content>
              <MessageCircle aria-hidden="true" size={18} /> WhatsApp
            </a>
            <a href={site.googleMapsUrl} target="_blank" rel="noreferrer" data-content>
              <MapPin aria-hidden="true" size={18} /> Itinéraire
            </a>
          </nav>
        </div>
        <p className="footer-copyright" data-content>© KLB</p>
      </div>
      <div className="footer-bottom-bar" data-content>
        <span>© 2026 KLB Restaurant</span>
        <span>Site conçu par {'</DevJ>'}</span>
      </div>
    </footer>
  );
}
