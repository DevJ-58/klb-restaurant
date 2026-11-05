import { useId, useState, type CSSProperties } from 'react';
import { ChefHat, MessageCircle, Phone, QrCode, type LucideIcon } from 'lucide-react';
import { site } from '../../config/site';
import { TransitionLink } from '../transition/TransitionLink';

type OrderTileType = 'remote' | 'table';

type OrderTileProps = {
  type: OrderTileType;
};

type TileContent = {
  variant: OrderTileType;
  arc: string;
  image: string;
  imageAlt: string;
  fallbackIcon: LucideIcon;
  label: string;
  title: string;
  description: string;
};

const tileContent: Record<OrderTileType, TileContent> = {
  remote: {
    variant: 'remote',
    arc: 'Par WhatsApp ou par téléphone',
    image: '/images/plats/plat-filet-mignon.jpg',
    imageAlt: 'Plat de filet mignon',
    fallbackIcon: ChefHat,
    label: 'À distance',
    title: 'Commander',
    description: 'Appelez ou écrivez-nous sur WhatsApp, on s’occupe du reste.',
  },
  table: {
    variant: 'table',
    arc: 'Menu et commande depuis votre table',
    image: '/images/ambiance/ambiance-detail-table.jpg',
    imageAlt: 'Table dressée au restaurant',
    fallbackIcon: QrCode,
    label: 'Au restaurant',
    title: 'Déjà à table ?',
    description: 'Scannez le QR code de votre table pour voir le menu et commander.',
  },
};

function TileArc({ children }: { children: string }) {
  const pathId = `order-tile-arc-${useId().replace(/:/g, '')}`;

  return (
    <svg
      className="order-tile-arc"
      viewBox="0 0 400 120"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path id={pathId} d="M 20 110 Q 200 -20 380 110" />
      </defs>
      <text>
        <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
          {children}
        </textPath>
      </text>
    </svg>
  );
}

function TileDisc({
  image,
  alt,
  FallbackIcon,
}: {
  image: string;
  alt: string;
  FallbackIcon: LucideIcon;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className={`tile-disc${imageFailed ? ' tile-disc--fallback' : ''}`}
      data-content="media"
    >
      {imageFailed ? (
        <FallbackIcon className="tile-disc-fallback-icon" aria-hidden="true" />
      ) : (
        <span className="tile-disc-photo-frame">
          <img
            className="tile-disc-photo"
            src={image}
            alt={imageLoaded ? alt : ''}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
          />
        </span>
      )}
    </div>
  );
}

function TileButton({
  href,
  className,
  children,
  external = false,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <a
      className={`order-button ${className}`}
      href={href}
      data-content="text"
      data-magnetic
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

function OrderTileActions({ type }: { type: OrderTileType }) {
  if (type === 'remote') {
    return (
      <>
        <div className="order-tile-action-row">
          <TileButton href={site.whatsappLink()} className="order-button--gold" external>
            <MessageCircle aria-hidden="true" size={19} />
            <span>Écrire sur WhatsApp</span>
          </TileButton>
          <TileButton href={site.phoneLink} className="order-button--light-outline">
            <Phone aria-hidden="true" size={19} />
            <span>Appeler</span>
          </TileButton>
        </div>
        <p className="order-tile-menu-link-wrap">
          <TransitionLink className="order-tile-menu-link" to="/carte" data-content="text">
            Voir la carte
          </TransitionLink>
        </p>
      </>
    );
  }

  return (
    <>
      <div className="order-tile-action-row">
        {site.tableMenuUrl ? (
          <>
            <TileButton href={site.tableMenuUrl} className="order-button--gold" external>
              <QrCode aria-hidden="true" size={19} />
              <span>Ouvrir le menu de ma table</span>
            </TileButton>
            <p className="order-tile-table-note" data-content="text">
              Réservé aux clients installés à une table.
            </p>
          </>
        ) : (
          <p className="order-tile-table-hint">
            <span className="order-tile-table-icon" aria-hidden="true">
              <QrCode size={20} />
            </span>
            <span data-content="text">Le QR code est posé sur votre table.</span>
          </p>
        )}
      </div>
      <p className="order-tile-menu-link-wrap">
        <TransitionLink className="order-tile-menu-link" to="/carte" data-content="text">
          Voir la carte
        </TransitionLink>
      </p>
    </>
  );
}

export function OrderTile({ type }: OrderTileProps) {
  const content = tileContent[type];
  const style = {
    '--order-tile-bg':
      type === 'remote'
        ? 'radial-gradient(60% 50% at 50% 0%, #164229 0%, #0E2A1A 70%)'
        : 'linear-gradient(145deg, #1A110B 0%, #2B1A06 100%)',
  } as CSSProperties;

  return (
    <article
      className={`order-tile order-tile--${content.variant} reveal`}
      style={style}
      aria-labelledby={`order-tile-title-${type}`}
    >
      <TileArc>{content.arc}</TileArc>
      <TileDisc image={content.image} alt={content.imageAlt} FallbackIcon={content.fallbackIcon} />
      <p className="order-tile-label" data-content="text">
        {content.label}
      </p>
      <h3 className="order-tile-title" id={`order-tile-title-${type}`} data-content="text">
        {content.title}
      </h3>
      <p className="order-tile-description" data-content="text">
        {content.description}
      </p>
      <div className="order-tile-actions">
        <OrderTileActions type={type} />
      </div>
    </article>
  );
}
