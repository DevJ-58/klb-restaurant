import { forwardRef, useState, type CSSProperties } from 'react';
import { Bell } from 'lucide-react';
import type { MenuItem } from '../../data/menu';

type PlateProps = {
  item: MenuItem;
  size: string;
  priority?: boolean;
};

export const Plate = forwardRef<HTMLDivElement, PlateProps>(function Plate(
  { item, size, priority = false },
  ref,
) {
  const [imageFailed, setImageFailed] = useState(!item.image);
  const style = { '--plate-size': size } as CSSProperties;

  return (
    <div className="plate" style={style} data-content>
      <span className="plate-gold-ring" aria-hidden="true" />
      <span className="plate-ivory-disc">
        <span className="plate-photo" ref={ref}>
          {imageFailed ? (
            <span className="plate-fallback">
              <Bell className="plate-fallback-icon" aria-hidden="true" />
              <span className="plate-fallback-name">{item.name}</span>
            </span>
          ) : (
            <img
              src={item.image}
              alt=""
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding="async"
              data-content
              onError={() => setImageFailed(true)}
            />
          )}
        </span>
      </span>
    </div>
  );
});
