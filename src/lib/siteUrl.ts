export function siteUrl(path = ''): string {
  const configuredOrigin = import.meta.env.VITE_SITE_URL?.trim().replace(/\/+$/, '');
  const origin =
    configuredOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
  if (!origin) {
    return path || '/';
  }
  return new URL(path.replace(/^\/+/, ''), `${origin}/`).toString();
}
