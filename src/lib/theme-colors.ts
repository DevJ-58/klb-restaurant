export function cssColor(token: string): string {
  if (typeof document === 'undefined') {
    return token;
  }

  const normalizedToken = token.startsWith('--') ? token : `--${token}`;
  const value = getComputedStyle(document.documentElement).getPropertyValue(normalizedToken).trim();
  return value || token;
}

export function useResolvedTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') {
    return 'dark';
  }

  const theme = document.documentElement.dataset.theme;
  return theme === 'light' ? 'light' : 'dark';
}
