import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';

/**
 * Wrap anything that animates with Motion in this: for visitors whose system asks for less motion,
 * its animations become instant fades. It lives here rather than around the whole app so that
 * pages without Motion animations don't download Motion at all.
 */
export function ReducedMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
