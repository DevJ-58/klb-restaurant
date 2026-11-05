import type { ReactNode } from 'react';

export function splitChars(text: string, className: string): ReactNode[] {
  return Array.from(text, (character, index) => (
    <span className={className} aria-hidden="true" key={`${index}-${character}`}>
      {character === ' ' ? '\u00a0' : character}
    </span>
  ));
}
