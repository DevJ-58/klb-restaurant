import type { ReactNode } from 'react';
import { Section } from './Section';

type SectionShellProps = {
  children: ReactNode;
  tone: 'ink' | 'ivory';
  className?: string;
  seam?: 'dome';
  id?: string;
};

export function SectionShell({ children, tone, className = '', seam, id }: SectionShellProps) {
  return (
    <Section
      id={id}
      data-theme={tone === 'ivory' ? 'light' : 'dark'}
      className={`section-shell section-shell--${tone}${seam ? ` section-shell--seam-${seam}` : ''} ${className}`.trim()}
    >
      <div className="section-shell-inner">{children}</div>
    </Section>
  );
}
