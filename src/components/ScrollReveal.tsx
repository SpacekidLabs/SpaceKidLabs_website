import { motion, HTMLMotionProps } from 'motion/react';
import { ReactNode } from 'react';

interface ScrollRevealProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
}

export function ScrollReveal({ children, className, ...props }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
