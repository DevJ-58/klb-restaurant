import manifestJson from '../data/image-manifest.json';

type ImageVariant = {
  src: string;
  width: number;
};

type ImageManifestEntry = {
  width: number;
  height: number;
  avif: ImageVariant[];
  webp: ImageVariant[];
};

type ImageManifest = Record<string, ImageManifestEntry>;

const imageManifest = manifestJson as ImageManifest;

export type PictureProps = {
  width: number;
  height: number;
  avifSrcSet: string;
  webpSrcSet: string;
  sizes: string;
};

export function getPictureProps(src: string, sizes = '100vw'): PictureProps | undefined {
  const image = imageManifest[src];
  if (!image) {
    return undefined;
  }
  return {
    width: image.width,
    height: image.height,
    avifSrcSet: image.avif.map(({ src: path, width }) => `${path} ${width}w`).join(', '),
    webpSrcSet: image.webp.map(({ src: path, width }) => `${path} ${width}w`).join(', '),
    sizes,
  };
}

export function getImageSet(src: string): string {
  const image = imageManifest[src];
  if (!image) {
    return `url("${src}")`;
  }
  const candidates = [
    ...image.avif.map(({ src: path }) => `url("${path}") type("image/avif")`),
    ...image.webp.map(({ src: path }) => `url("${path}") type("image/webp")`),
    `url("${src}") type("${src.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'}")`,
  ];
  return `image-set(${candidates.join(', ')})`;
}
