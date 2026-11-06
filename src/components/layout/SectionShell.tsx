import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react';

type SectionShellProps = Omit<
  ComponentPropsWithoutRef<'section'>,
  'id' | 'className' | 'style' | 'children'
> & {
  id?: string;
  bgStart: string;
  bgEnd?: string;
  seam?: 'none' | 'fade' | 'dome';
  prevBg?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

function resolveThemeToken(token: string): string {
  const normalized = token.trim();
  if (
    normalized.startsWith('#') ||
    normalized.startsWith('rgb') ||
    normalized.startsWith('hsl') ||
    normalized.startsWith('linear-gradient') ||
    normalized.startsWith('var(')
  ) {
    return normalized;
  }

  return `var(--${normalized})`;
}

export const SectionShell = forwardRef<HTMLElement, SectionShellProps>(function SectionShell(
  {
    id,
    bgStart,
    bgEnd = bgStart,
    seam = 'none',
    prevBg,
    className = '',
    style,
    children,
    ...props
  },
  ref,
) {
  const sectionTheme = (props as { 'data-theme'?: string })['data-theme'] ?? 'dark';
  const shellStyle = {
    ...style,
    backgroundImage: `linear-gradient(to bottom, ${resolveThemeToken(bgStart)}, ${resolveThemeToken(bgEnd)})`,
    ...(prevBg ? { '--section-prev-bg': resolveThemeToken(prevBg) } : {}),
    ...(bgStart ? { '--section-bg-start': resolveThemeToken(bgStart) } : {}),
    ...(bgEnd ? { '--section-bg-end': resolveThemeToken(bgEnd) } : {}),
  } as CSSProperties;

  return (
    <section
      {...props}
      id={id}
      ref={ref}
      data-bg-end={bgEnd}
      data-theme={sectionTheme}
      className={`section-shell section-shell--${seam}${className ? ` ${className}` : ''}`}
      style={shellStyle}
    >
      {children}
    </section>
  );
});
