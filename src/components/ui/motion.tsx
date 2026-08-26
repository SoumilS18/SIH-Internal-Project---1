import React from 'react';
import { useCountUp, useInView, useMagnetic, usePrefersReducedMotion } from '@/lib/hooks';

/* ------------------------------------------------------------------ */
/* Reveal — scroll-triggered entrance (opacity + rise)                 */
/* ------------------------------------------------------------------ */
interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  as?: 'div' | 'section' | 'li' | 'span' | 'header' | 'article';
  style?: React.CSSProperties;
}
export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 22,
  once = true,
  as = 'div',
  style,
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ once });
  const reduced = usePrefersReducedMotion();
  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: inView || reduced ? 1 : 0,
        transform: inView || reduced ? 'none' : `translateY(${y}px)`,
        transition: `opacity 0.7s var(--ease-out) ${delay}ms, transform 0.8s var(--ease-out) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* MagneticButton — magnetic pull + spring press                       */
/* ------------------------------------------------------------------ */
interface MagneticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  strength?: number;
  as?: 'button';
}
export function MagneticButton({
  strength = 0.28,
  className = '',
  children,
  ...rest
}: MagneticButtonProps) {
  const ref = useMagnetic<HTMLButtonElement>(strength);
  return (
    <button ref={ref} className={className} {...rest}>
      <span className="pointer-events-none inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Counter — animated number, triggers when scrolled into view         */
/* ------------------------------------------------------------------ */
interface CounterProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
  /** group with locale separators (default true) */
  group?: boolean;
  /** compact Indian style (e.g. 1.2L / 3.4Cr) */
  compactINR?: boolean;
}
export function Counter({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  durationMs = 1500,
  className = '',
  group = true,
  compactINR = false,
}: CounterProps) {
  const [ref, inView] = useInView<HTMLSpanElement>({ once: true });
  const n = useCountUp(value, { play: inView, decimals, durationMs });

  let body: string;
  if (compactINR) {
    body = formatCompactINR(n);
  } else if (group) {
    body = n.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } else {
    body = n.toFixed(decimals);
  }

  return (
    <span ref={ref} className={className}>
      {prefix}
      {body}
      {suffix}
    </span>
  );
}

export function formatCompactINR(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e7) return (n / 1e7).toFixed(abs >= 1e8 ? 0 : 1) + ' Cr';
  if (abs >= 1e5) return (n / 1e5).toFixed(abs >= 1e6 ? 0 : 1) + ' L';
  if (abs >= 1e3) return (n / 1e3).toFixed(0) + 'k';
  return Math.round(n).toString();
}
