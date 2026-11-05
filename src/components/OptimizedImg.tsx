import type { ImgHTMLAttributes } from 'react';
import { getPictureProps } from '../lib/images';

type OptimizedImgProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'sizes' | 'loading' | 'decoding' | 'fetchPriority'
> & {
  src: string;
  srcSet?: string;
  sizes?: string;
  loading?: 'eager' | 'lazy';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
};

export function OptimizedImg({
  src,
  srcSet,
  sizes,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  ...imageProps
}: OptimizedImgProps) {
  const pictureProps = getPictureProps(src, sizes ?? '100vw');
  const image = (
    <img
      {...imageProps}
      src={src}
      srcSet={srcSet}
      sizes={sizes ?? (pictureProps ? pictureProps.sizes : undefined)}
      width={imageProps.width ?? pictureProps?.width}
      height={imageProps.height ?? pictureProps?.height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
    />
  );
  if (!pictureProps) return image;

  return (
    <picture>
      <source type="image/avif" srcSet={pictureProps.avifSrcSet} sizes={pictureProps.sizes} />
      <source type="image/webp" srcSet={pictureProps.webpSrcSet} sizes={pictureProps.sizes} />
      {image}
    </picture>
  );
}
