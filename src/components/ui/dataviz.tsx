import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInView, usePrefersReducedMotion } from '@/lib/hooks';
import { Counter } from '@/components/ui/motion';

type Tone = 'field' | 'grain' | 'soil' | 'sky';

function toneVar(tone: Tone): string {
  switch (tone) {
    case 'grain':
      return 'var(--grain)';
    case 'soil':
      return 'var(--soil)';
    case 'sky':
      return 'var(--sky)';
    default:
      return 'var(--field)';
  }
}

/* ------------------------------------------------------------------ */
/* StatBlock — large animated metric, no card (keeps layout open)      */
/* ------------------------------------------------------------------ */
interface StatBlockProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  compactINR?: boolean;
  tone?: Tone;
  className?: string;
  sub?: string;
}
export function StatBlock({
  label,
  value,
  prefix,
  suffix,
  decimals = 0,
  compactINR = false,
  tone = 'field',
  className = '',
  sub,
}: StatBlockProps) {
  return (
    <div className={className}>
      <div className="t-eyebrow mb-1.5">{label}</div>
      <div
        className="t-metric text-[clamp(1.7rem,3.4vw,2.9rem)]"
        style={{ color: 'var(--ink)' }}
      >
        <Counter
          value={value}
          prefix={prefix}
          suffix={suffix}
          decimals={decimals}
          compactINR={compactINR}
        />
      </div>
      <div className="mt-1.5 h-[3px] w-10 rounded-full" style={{ background: toneVar(tone) }} />
      {sub && <div className="mt-2 text-sm text-[var(--ink-soft)]">{sub}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ProgressRing — SVG ring that draws to a value (0..100)              */
/* ------------------------------------------------------------------ */
interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  centerTop?: React.ReactNode;
  centerBottom?: React.ReactNode;
  trackOpacity?: number;
  className?: string;
}
export function ProgressRing({
  value,
  size = 132,
  stroke = 11,
  tone = 'field',
  centerTop,
  centerBottom,
  trackOpacity = 1,
  className = '',
}: ProgressRingProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true });
  const reduced = usePrefersReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const target = c * (1 - clamped / 100);
  const offset = inView || reduced ? target : c;

  return (
    <div ref={ref} className={`relative inline-grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
          opacity={trackOpacity}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={toneVar(tone)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: reduced ? undefined : 'stroke-dashoffset 1.5s var(--ease-out)',
            filter: `drop-shadow(0 0 6px ${toneVar(tone)}55)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        <div>
          {centerTop && <div className="t-metric text-[clamp(1.3rem,2.4vw,1.8rem)] text-[var(--ink)]">{centerTop}</div>}
          {centerBottom && <div className="t-eyebrow mt-1">{centerBottom}</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DrawingLineChart — self-drawing area/line for a daily series        */
/* ------------------------------------------------------------------ */
interface DrawingLineChartProps {
  points: number[];
  labels?: string[];
  width?: number;
  height?: number;
  tone?: Tone;
  fill?: boolean;
  className?: string;
}
export function DrawingLineChart({
  points,
  labels,
  width = 520,
  height = 150,
  tone = 'sky',
  fill = true,
  className = '',
}: DrawingLineChartProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true });
  const reduced = usePrefersReducedMotion();
  const pathRef = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);

  const pad = { l: 8, r: 8, t: 14, b: 22 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const { line, area, dots } = useMemo(() => {
    if (!points.length) return { line: '', area: '', dots: [] as Array<{ x: number; y: number }> };
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const step = points.length > 1 ? iw / (points.length - 1) : 0;
    const pts = points.map((p, i) => ({
      x: pad.l + i * step,
      y: pad.t + ih - ((p - min) / span) * ih,
    }));
    const line = pts.map((pt, i) => `${i ? 'L' : 'M'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${(pad.t + ih).toFixed(1)} L${pts[0].x.toFixed(
      1
    )},${(pad.t + ih).toFixed(1)} Z`;
    return { line, area, dots: pts };
  }, [points, iw, ih, pad.l, pad.r, pad.t, pad.b]);

  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength());
  }, [line]);

  const drawn = inView || reduced;
  const gid = useMemo(() => `lc-${Math.random().toString(36).slice(2, 8)}`, []);

  return (
    <div ref={ref} className={className}>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={toneVar(tone)} stopOpacity="0.32" />
            <stop offset="100%" stopColor={toneVar(tone)} stopOpacity="0" />
          </linearGradient>
        </defs>
        {fill && (
          <path
            d={area}
            fill={`url(#${gid})`}
            opacity={drawn ? 1 : 0}
            style={{ transition: 'opacity 0.9s ease 0.5s' }}
          />
        )}
        <path
          ref={pathRef}
          d={line}
          fill="none"
          stroke={toneVar(tone)}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={len || undefined}
          strokeDashoffset={drawn ? 0 : len}
          style={{ transition: reduced ? undefined : 'stroke-dashoffset 1.6s var(--ease-out)' }}
        />
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={3}
            fill="var(--surface-solid)"
            stroke={toneVar(tone)}
            strokeWidth={2}
            opacity={drawn ? 1 : 0}
            style={{ transition: `opacity 0.4s ease ${0.6 + i * 0.08}s` }}
          />
        ))}
        {labels &&
          labels.map((lab, i) => {
            const step = points.length > 1 ? iw / (points.length - 1) : 0;
            return (
              <text
                key={i}
                x={pad.l + i * step}
                y={height - 4}
                textAnchor="middle"
                className="font-data"
                fontSize="9"
                fill="var(--ink-faint)"
              >
                {lab}
              </text>
            );
          })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MiniBars — animated vertical bars (e.g. daily rainfall)             */
/* ------------------------------------------------------------------ */
interface MiniBarsProps {
  values: number[];
  labels?: string[];
  tone?: Tone;
  height?: number;
  className?: string;
}
export function MiniBars({ values, labels, tone = 'sky', height = 90, className = '' }: MiniBarsProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true });
  const reduced = usePrefersReducedMotion();
  const max = Math.max(...values, 1);
  const on = inView || reduced;
  return (
    <div ref={ref} className={`flex items-end gap-1.5 ${className}`} style={{ height }}>
      {values.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
          <div
            className="w-full rounded-t-md"
            style={{
              height: on ? `${(v / max) * 100}%` : '2%',
              minHeight: 2,
              background: `linear-gradient(${toneVar(tone)}, ${toneVar(tone)}66)`,
              transition: reduced ? undefined : `height 0.9s var(--ease-out) ${i * 0.06}s`,
            }}
          />
          {labels && <span className="font-data text-[9px] text-[var(--ink-faint)]">{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RiskMeter — 4-segment strength; non-color cues via label + fill     */
/* ------------------------------------------------------------------ */
interface RiskMeterProps {
  label: string; // display text (may be localized)
  className?: string;
  caption?: string;
  /** 1..4 strength. When omitted, parsed from an English label (LOW|MODERATE|HIGH|CRITICAL). Pass this when `label` is localized so the fill stays correct. */
  level?: 1 | 2 | 3 | 4;
}
export function RiskMeter({ label, className = '', caption, level: levelProp }: RiskMeterProps) {
  const level = useMemo(() => {
    if (levelProp) return levelProp;
    const l = (label || '').toUpperCase();
    if (l.includes('CRIT')) return 4;
    if (l.includes('HIGH')) return 3;
    if (l.includes('MOD')) return 2;
    return 1;
  }, [label, levelProp]);
  const color = level >= 3 ? 'var(--risk)' : level === 2 ? 'var(--warn)' : 'var(--ok)';
  const [ref, inView] = useInView<HTMLDivElement>({ once: true });
  const reduced = usePrefersReducedMotion();
  const on = inView || reduced;
  return (
    <div ref={ref} className={className}>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className="h-2 flex-1 rounded-full"
            style={{
              background: seg <= level ? color : 'var(--line)',
              opacity: on ? 1 : 0.3,
              transform: on ? 'scaleX(1)' : 'scaleX(0.4)',
              transformOrigin: 'left',
              transition: reduced ? undefined : `all 0.5s var(--ease-out) ${seg * 0.1}s`,
            }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color }}>
          {label}
        </span>
        {caption && <span className="text-xs text-[var(--ink-faint)]">{caption}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AllocationBar — animated stacked crop allocation                    */
/* ------------------------------------------------------------------ */
interface AllocationSeg {
  name: string;
  share: number; // percentage
  color: string;
}
export function AllocationBar({ segments, className = '' }: { segments: AllocationSeg[]; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true });
  const reduced = usePrefersReducedMotion();
  const on = inView || reduced;
  const total = segments.reduce((s, x) => s + x.share, 0) || 1;
  return (
    <div ref={ref} className={className}>
      <div className="flex h-4 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-inset)' }}>
        {segments.map((s, i) => (
          <div
            key={s.name + i}
            title={`${s.name} · ${Math.round((s.share / total) * 100)}%`}
            style={{
              width: on ? `${(s.share / total) * 100}%` : '0%',
              background: s.color,
              transition: reduced ? undefined : `width 1s var(--ease-out) ${i * 0.12}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DonutChart — animated multi-segment ring that draws on scroll-in    */
/* Dependency-free SVG. Each arc "draws" via stroke-dashoffset, gapped  */
/* for a segmented look, staggered, and reduced-motion aware.           */
/* ------------------------------------------------------------------ */
export interface DonutSegment {
  name: string;
  value: number;
  color: string;
}
interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  /** px gap rendered between adjacent segments along the arc */
  gap?: number;
  centerTop?: React.ReactNode;
  centerBottom?: React.ReactNode;
  className?: string;
}
export function DonutChart({
  segments,
  size = 210,
  thickness = 26,
  gap = 4,
  centerTop,
  centerBottom,
  className = '',
}: DonutChartProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ once: true });
  const reduced = usePrefersReducedMotion();
  const on = inView || reduced;

  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gapDeg = (gap / c) * 360;

  const arcs = useMemo(() => {
    const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0) || 1;
    let accFrac = 0;
    return segments.map((seg, i) => {
      const frac = Math.max(0, seg.value) / total;
      const len = Math.max(0.001, frac * c - gap); // visible arc length (minus gap)
      const rotation = -90 + accFrac * 360 + gapDeg / 2; // start at 12 o'clock, half-gap inset
      accFrac += frac;
      return { key: seg.name + i, color: seg.color, len, rotation, i };
    });
  }, [segments, c, gap, gapDeg]);

  return (
    <div
      ref={ref}
      className={`relative inline-grid place-items-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} role="presentation">
        {/* track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-inset)" strokeWidth={thickness} />
        {arcs.map(({ key, color, len, rotation, i }) => (
          <circle
            key={key}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="butt"
            strokeDasharray={c}
            strokeDashoffset={on ? c - len : c}
            transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            style={{
              transition: reduced ? undefined : `stroke-dashoffset 0.9s var(--ease-out) ${0.15 + i * 0.13}s`,
            }}
          />
        ))}
      </svg>
      {(centerTop || centerBottom) && (
        <div className="absolute inset-0 grid place-items-center text-center leading-none">
          <div>
            {centerTop && (
              <div className="t-metric text-[clamp(1.1rem,2.3vw,1.6rem)] text-[var(--ink)]">{centerTop}</div>
            )}
            {centerBottom && <div className="t-eyebrow mt-1.5">{centerBottom}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
