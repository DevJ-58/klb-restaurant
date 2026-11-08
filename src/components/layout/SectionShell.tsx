import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react';

type SectionShellProps = Omit<
  ComponentPropsWithoutRef<'section'>,
  'id' | 'className' | 'style' | 'children' | 'data-surface'
> & {
  id?: string;
  'data-surface'?: 'light' | 'dark';
  bgStart: string;
  bgEnd?: string;
  seam?: 'none' | 'fade' | 'dome';
  prevBg?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

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
    'data-surface': dataSurface = 'dark',
    ...props
  },
  ref,
) {
  const shellStyle = {
    ...style,
    backgroundImage: `linear-gradient(to bottom, ${bgStart}, ${bgEnd})`,
    ...(prevBg ? { '--section-prev-bg': prevBg } : {}),
    ...(bgStart ? { '--section-bg-start': bgStart } : {}),
    ...(bgEnd ? { '--section-bg-end': bgEnd } : {}),
  } as CSSProperties;

  return (
    <section
      {...props}
      id={id}
      ref={ref}
      data-bg-end={bgEnd}
      data-surface={dataSurface}
      className={`section-shell section-shell--${seam}${className ? ` ${className}` : ''}`}
      style={shellStyle}
    >
      {children}
    </section>
  );
});
