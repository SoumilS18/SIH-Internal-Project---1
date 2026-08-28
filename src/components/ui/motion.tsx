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
  const [forceVisible, setForceVisible] = React.useState(false);
  const reduced = usePrefersReducedMotion();

  React.useEffect(() => {
    const t = setTimeout(() => setForceVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const visible = inView || forceVisible || reduced;
  const Tag = as as any;
  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : `translateY(${y}px)`,
        transition: `opacity 0.6s var(--ease-out) ${delay}ms, transform 0.7s var(--ease-out) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* StageSwap — the journey's page-to-page morph                        */
/* ------------------------------------------------------------------ */
interface StageSwapProps {
  /** identity of the page currently requested — changing it plays the morph */
  stageKey: string | number;
  /**
   * Where this page sits in the five-page journey (1…5). Travelling to a lower
   * number reads as going back, so the world settles the other way. Without it
   * every move would look like progress, which is a lie on a Back button.
   */
  order?: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * ONE WORLD, FIVE PAGES.
 *
 * The farmer is walking through a single place, so pages must not cut. The page
 * being left settles away in the direction of travel while the next one rises
 * to meet them; the atmosphere behind (`WorldBackground`) and the floating
 * `JourneyNav` never unmount, so only the content changes hands.
 *
 * The outgoing tree is held for the length of the exit — one render's worth of
 * frozen children, not a copy — so a screen is never torn down mid-fade. The
 * wrapper's key stays pinned to the *visible* page for exactly that reason:
 * flipping it early would remount the page on its way out and re-fire its
 * mount effects.
 *
 * Under `prefers-reduced-motion` the swap is instant: the exit delay is skipped
 * entirely rather than left to the global animation-duration override, which
 * would otherwise hold a blank frame.
 */
export function StageSwap({ stageKey, order = 0, children, className = '' }: StageSwapProps) {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = React.useState<{ key: string | number; order: number }>({
    key: stageKey,
    order,
  });
  const [leaving, setLeaving] = React.useState(false);
  const [back, setBack] = React.useState(false);

  // The tree on screen right now. Frozen only while it is leaving, so ordinary
  // prop updates (a plan finishing loading, say) still flow straight through.
  const held = React.useRef<React.ReactNode>(children);
  if (!leaving) held.current = children;

  React.useEffect(() => {
    if (stageKey === visible.key) return;
    setBack(order < visible.order);
    if (reduced) {
      setVisible({ key: stageKey, order });
      return;
    }
    setLeaving(true);
    const t = setTimeout(() => {
      setVisible({ key: stageKey, order });
      setLeaving(false);
    }, 240);
    return () => clearTimeout(t);
  }, [stageKey, order, visible, reduced]);

  // A new page always starts at its own beginning.
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  }, [visible.key, reduced]);

  const phase = leaving
    ? back
      ? 'stage-out-back'
      : 'stage-out'
    : back
      ? 'stage-in-back'
      : 'stage-in';

  return (
    <div key={`stage-${visible.key}`} className={`${className} ${phase}`.trim()}>
      {leaving ? held.current : children}
    </div>
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
