import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 15,
    scale: 0.99
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -15,
    scale: 0.99
  }
};

const pageTransition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1.0] as [number, number, number, number] // smooth easing
};

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
