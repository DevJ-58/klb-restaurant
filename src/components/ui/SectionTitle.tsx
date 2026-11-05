import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../lib/motion';

gsap.registerPlugin(ScrollTrigger);

type SectionTitleProps = {
  id?: string;
  className?: string;
  size?: 'default' | 'compact';
  children: ReactNode;
  'aria-label'?: string;
};

export function SectionTitle({ id, className = '', size = 'default', children, ...props }: SectionTitleProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useGSAP(
    () => {
      const title = titleRef.current;
      const line = title?.querySelector<HTMLElement>('.section-title-line');
      if (size === 'compact' || !title || !line || prefersReducedMotion()) {
        return;
      }

      const trigger = ScrollTrigger.create({
        trigger: title,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.fromTo(
            line,
            { yPercent: 100, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power4.out' },
          );
        },
      });

      return () => trigger.kill();
    },
    { scope: titleRef, dependencies: [size], revertOnUpdate: true },
  );

  return (
    <h2
      {...props}
      id={id}
      className={`section-title${size === 'compact' ? ' section-title--compact' : ''}${className ? ` ${className}` : ''}`}
      ref={titleRef}
      data-content={size === 'compact' ? 'text' : true}
    >
      <span className="section-title-mask">
        <span className="section-title-line">{children}</span>
      </span>
    </h2>
  );
}
