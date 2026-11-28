import type { HTMLAttributes, ReactNode } from 'react';

interface ScrollRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

/**
 * Fades its content up as it scrolls into view. Pure CSS (`.reveal` in index.css, a scroll-driven
 * animation), so it needs no JavaScript and content already on screen is visible at first paint.
 */
export function ScrollReveal({ children, className, ...props }: ScrollRevealProps) {
  return (
    <div className={className ? `reveal ${className}` : 'reveal'} {...props}>
      {children}
    </div>
  );
}
