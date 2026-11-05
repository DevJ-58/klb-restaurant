import { useEffect } from 'react';
import { siteUrl } from './siteUrl';

type PageMeta = {
  title: string;
  description: string;
  path: string;
  robots?: string;
};

function findOrCreateMeta(property: string, value: string): HTMLMetaElement {
  const selector = property.startsWith('og:') || property.startsWith('twitter:')
    ? `meta[property="${property}"]`
    : `meta[name="${property}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    if (property.startsWith('og:') || property.startsWith('twitter:')) {
      element.setAttribute('property', property);
    } else {
      element.name = property;
    }
    document.head.append(element);
  }
  element.content = value;
  return element;
}

export function usePageMeta({ title, description, path, robots }: PageMeta): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const previousCanonical = canonical?.href;
    const canonicalLink = canonical ?? document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = siteUrl(path);
    if (!canonical) document.head.append(canonicalLink);
    const metaValues = [
      ['description', description],
      ['og:title', title],
      ['og:description', description],
      ['og:url', siteUrl(path)],
      ['og:image', siteUrl('og-partage.jpg')],
      ['twitter:title', title],
      ['twitter:description', description],
      ['twitter:card', 'summary_large_image'],
      ...(robots ? [['robots', robots]] : []),
    ] as const;
    const previousValues = metaValues.map(([key]) => {
      const property = key.startsWith('og:') || key.startsWith('twitter:');
      const selector = property ? `meta[property="${key}"]` : `meta[name="${key}"]`;
      return document.head.querySelector<HTMLMetaElement>(selector)?.content;
    });
    const metaElements = metaValues.map(([key, value]) => findOrCreateMeta(key, value));

    return () => {
      document.title = previousTitle;
      if (previousCanonical === undefined) {
        canonicalLink.remove();
      } else {
        canonicalLink.href = previousCanonical;
      }
      metaElements.forEach((element, index) => {
        const previousValue = previousValues[index];
        if (previousValue === undefined) {
          element.remove();
        } else {
          element.content = previousValue;
        }
      });
    };
  }, [description, path, robots, title]);
}
