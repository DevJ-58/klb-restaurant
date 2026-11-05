import { forwardRef, type ComponentPropsWithoutRef } from 'react';

type SectionProps = ComponentPropsWithoutRef<'section'>;

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { className = '', ...props },
  ref,
) {
  return <section {...props} className={`site-section ${className}`.trim()} ref={ref} />;
});
