'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  variant?: 'fade-up' | 'pop' | 'glow-success' | 'slide-side';
  className?: string;
}

export const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  
  'glow-success': {
    boxShadow: ['0px 0px 0px rgba(34, 197, 94, 0)', '0px 0px 20px rgba(34, 197, 94, 0.4)', '0px 0px 0px rgba(34, 197, 94, 0)'],
    transition: { duration: 1.5, repeat: 1 }
  },
  
  'slide-side': {
    x: [0, 50, 0],
    opacity: [1, 0, 1],
    transition: { duration: 0.5 }
  }
};

export function AnimatedCard({ children, variant = 'fade-up', className = '', ...props }: AnimatedCardProps) {
  const selectedVariant = variant === 'fade-up' ? cardVariants.visible : {};
  
  return (
    <motion.div
      layout
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={cardVariants}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
