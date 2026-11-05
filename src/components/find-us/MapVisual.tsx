import { useId, useState } from 'react';
import { MapPin } from 'lucide-react';
import { site } from '../../config/site';

export function MapVisual() {
  const [imageFailed, setImageFailed] = useState(false);
  const badgePathId = `find-us-badge-${useId().replace(/:/g, '')}`;

  if (site.mapEmbedUrl) {
    return (
      <div className="find-us-map-frame reveal" data-content>
        <iframe
          src={site.mapEmbedUrl}
          title="Plan d’accès à KLB Restaurant"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="find-us-map-visual reveal" data-content>
      <div className={`find-us-photo-disc${imageFailed ? ' is-fallback' : ''}`}>
        {!imageFailed ? (
          <img
            src="/images/lieu/facade-klb.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <MapPin className="find-us-photo-fallback-icon" aria-hidden="true" />
        )}
      </div>
      <div className="find-us-location-badge" aria-hidden="true">
        <svg viewBox="0 0 150 150">
          <defs>
            <path
              id={badgePathId}
              d="M75,75 m-57,0 a57,57 0 1,1 114,0 a57,57 0 1,1 -114,0"
            />
          </defs>
          <text>
            <textPath href={`#${badgePathId}`}>Morofé • Yamoussoukro • </textPath>
          </text>
        </svg>
      </div>
      <span className="find-us-map-pin" aria-hidden="true">
        <MapPin size={31} strokeWidth={1.8} />
      </span>
    </div>
  );
}
