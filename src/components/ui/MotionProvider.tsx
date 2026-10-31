'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';

/** Disables transform/layout animations for visitors who prefer reduced motion. */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
