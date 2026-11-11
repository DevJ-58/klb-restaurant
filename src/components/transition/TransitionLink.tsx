import type { MouseEvent } from 'react';
import { Link, useLocation, useResolvedPath, type LinkProps } from 'react-router-dom';
import { usePageTransition } from './TransitionProvider';

type TransitionLinkProps = Omit<LinkProps, 'onClick'> & {
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function TransitionLink({
  to,
  onClick,
  target,
  ...props
}: TransitionLinkProps) {
  const location = useLocation();
  const resolved = useResolvedPath(to);
  const { isTransitioning, transitionTo } = usePageTransition();

  function handleClick(event: MouseEvent<HTMLAnchorElement>): void {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      target === '_blank'
    ) {
      return;
    }

    event.preventDefault();
    if (isTransitioning || resolved.pathname === location.pathname) {
      return;
    }

    transitionTo(to);
  }

  return <Link {...props} to={to} target={target} onClick={handleClick} />;
}
