import { useState } from 'react';

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className = '' }: BrandLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={`brand-monogram ${className}`.trim()} aria-label="KLB Restaurant">
        KLB
      </span>
    );
  }

  return (
    <img
      className={`brand-logo ${className}`.trim()}
      src="/images/brand/logo-klb-rond.png"
      alt="KLB Restaurant"
      onError={() => setFailed(true)}
    />
  );
}
