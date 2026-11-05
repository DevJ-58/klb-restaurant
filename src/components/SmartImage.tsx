import { useState, type CSSProperties } from 'react';
import { getPictureProps } from '../lib/images';

type SmartImageProps = {
  src?: string;
  alt: string;
  aspectRatio?: string;
  srcSet?: string;
  sizes?: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
  onLoad?: () => void;
  onError?: () => void;
};

export function SmartImage({
  src,
  alt,
  aspectRatio = '4 / 3',
  srcSet,
  sizes,
  className,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  onLoad,
  onError,
}: SmartImageProps) {
  const [imageFailed, setImageFailed] = useState(!src);
  const style = { '--image-ratio': aspectRatio } as CSSProperties;
  const classNames = ['smart-image', className].filter(Boolean).join(' ');
  const pictureProps = src ? getPictureProps(src, sizes ?? '100vw') : undefined;

  if (imageFailed) {
    return (
      <div
        className={`${classNames} smart-image--fallback`}
        style={style}
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      />
    );
  }

  return (
    <div className={classNames} style={style}>
      {pictureProps ? (
        <picture>
          {pictureProps.avifSrcSet && (
            <source type="image/avif" srcSet={pictureProps.avifSrcSet} sizes={pictureProps.sizes} />
          )}
          {pictureProps.webpSrcSet && (
            <source type="image/webp" srcSet={pictureProps.webpSrcSet} sizes={pictureProps.sizes} />
          )}
          <img
            src={src}
            srcSet={srcSet}
            sizes={sizes ?? '100vw'}
            width={pictureProps.width}
            height={pictureProps.height}
            alt={alt}
            loading={loading}
            decoding={decoding}
            fetchPriority={fetchPriority}
            onLoad={onLoad}
            onError={() => {
              setImageFailed(true);
              onError?.();
            }}
          />
        </picture>
      ) : (
        <img
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          loading={loading}
          decoding={decoding}
          fetchPriority={fetchPriority}
          onLoad={onLoad}
          onError={() => {
            setImageFailed(true);
            onError?.();
          }}
        />
      )}
    </div>
  );
}
