import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Droplets, Sparkles, X } from 'lucide-react';
import type { FarmDecisionResponse } from '@/types/farm';
import { cropStand, cropVisual, type CropForm } from '@/lib/crops';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  useElementSize,
  useInView,
  useIsTouch,
  usePointerField,
  usePrefersReducedMotion,
  useRafLoop,
} from '@/lib/hooks';

/* ==========================================================================
   THE LIVING FARM — AgriOptima's digital twin.

   A real plot of Indian cropland, modelled in CSS 3D: an extruded earth block
   whose strata are tinted by the district's actual soil type, plots sized by
   the acres the optimiser allocated, the allocated crops standing upright in
   rows, an irrigation channel feeding laterals between the plots, pollen
   drifting through the light on a 2D canvas, and the AI standing in the field
   as a signal you can walk up to and ask.

   Everything a label claims comes from the decision payload. Nothing here
   invents agronomy: risk wording maps `risk_score`, the irrigation read-out is
   the request's own irrigation type, and the AI's line is
   `explanation.headline` verbatim. With no decision yet it says "preview" and
   claims nothing.

   No WebGL, no animation library — CSS 3D transforms, one canvas, rAF.
   ========================================================================== */

export type TwinAiState = 'idle' | 'listening' | 'analyzing' | 'planning' | 'complete';

interface FarmDigitalTwinProps {
  decision?: FarmDecisionResponse | null;
  className?: string;
  height?: number;
  interactive?: boolean;
  scanning?: boolean;
  selectedCrop?: string | null;
  onSelectCrop?: (name: string | null) => void;
  showWeather?: boolean;
  compact?: boolean;
  /** Overrides the state inferred from `scanning` / `decision`. */
  aiState?: TwinAiState;
  /** Turn off when the host screen already shows the selected plot's numbers. */
  showDetailCard?: boolean;
  /**
   * `'auto'` (default) — cursor parallax when interactive, a slow ambient drift
   * when not. `'locked'` — the camera never moves.
   *
   * Lock it whenever something OUTSIDE the twin is pinned to a point on the
   * land (the cinematic's survey marks). A drifting camera rotates the ground
   * plane by a couple of degrees, which at this board size walks the field
   * tens of pixels away from any annotation that is not rotating with it.
   */
  camera?: 'auto' | 'locked';
}

/* -------------------------------------------------------------------------- */
/* Camera                                                                     */
/* -------------------------------------------------------------------------- */
const CAM_RX = 54;
const CAM_RZ = -6;
const BILLBOARD_REST = `rotateZ(${-CAM_RZ}deg) rotateX(${-CAM_RX}deg)`;

/** Stable object — `useInView` keeps its options in a dependency array. */
const VIEW_OPTS = { once: false, threshold: 0.04, rootMargin: '120px' };

const DEMO_PLOTS: Array<{ name: string; share: number }> = [
  { name: 'Wheat', share: 40 },
  { name: 'Mustard', share: 23 },
  { name: 'Gram', share: 32 },
];

/* -------------------------------------------------------------------------- */
/* Soil strata — the earth block is coloured by the district's real soil type  */
/* -------------------------------------------------------------------------- */
type Strata = [string, string, string];

const SOIL_FAMILIES: Array<[string, Strata]> = [
  ['black', ['#55584C', '#5E5C4B', '#3C3B32']],
  ['regur', ['#55584C', '#5E5C4B', '#3C3B32']],
  ['laterite', ['#7C5340', '#9C5334', '#6E3722']],
  ['red', ['#7A5A44', '#A8613F', '#77402B']],
  ['sandy', ['#8A8060', '#C4AC7C', '#9A855A']],
  ['desert', ['#8A8060', '#C4AC7C', '#9A855A']],
  ['arid', ['#8A8060', '#C4AC7C', '#9A855A']],
  ['saline', ['#807A63', '#B6AC8C', '#8E8365']],
  ['forest', ['#4F5340', '#6B6142', '#4A4029']],
  ['mountain', ['#4F5340', '#6B6142', '#4A4029']],
  ['loam', ['#655F42', '#96754A', '#6B4E2E']],
  ['alluvial', ['#6F6A47', '#A9834A', '#7A5029']],
];
const SOIL_DEFAULT: Strata = ['#6F6A47', '#A9834A', '#7A5029'];

function rgbOf(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = rgbOf(a);
  const [r2, g2, b2] = rgbOf(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${c(r1, r2)},${c(g1, g2)},${c(b1, b2)})`;
}

function soilFamily(soilType?: string): Strata {
  const key = (soilType || '').toLowerCase();
  for (const [needle, family] of SOIL_FAMILIES) {
    if (key.includes(needle)) return family;
  }
  return SOIL_DEFAULT;
}

/** Nine strata from topsoil down to parent material. */
function strataStack(family: Strata, n: number): string[] {
  const out: string[] = [];
  const half = (n - 1) / 2;
  for (let i = 0; i < n; i++) {
    out.push(
      i <= half
        ? mix(family[0], family[1], half === 0 ? 0 : i / half)
        : mix(family[1], family[2], (i - half) / (n - 1 - half))
    );
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Plots                                                                      */
/* -------------------------------------------------------------------------- */
interface Plot {
  key: string;
  name: string;
  tag: string;
  left: number;
  width: number;
  acres: number;
  yieldQ: number;
  roi: number;
  profit: number;
  risk: number;
  reason: string;
  top: string;
  side: string;
  head: string;
  form: CropForm;
  standH: number;
  spacing: number;
  fallow: boolean;
}

function conditionOf(risk: number, isHi: boolean): { label: string; tone: string } {
  if (risk <= 25) return { label: isHi ? 'अच्छी स्थिति' : 'Good condition', tone: 'var(--ok)' };
  if (risk <= 50) return { label: isHi ? 'मध्यम जोखिम' : 'Moderate risk', tone: 'var(--warn)' };
  return { label: isHi ? 'उच्च जोखिम' : 'High risk', tone: 'var(--risk)' };
}

function lakh(n: number, isHi: boolean): string {
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}${isHi ? ' लाख' : 'L'}`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/**
 * Has this visit already seen the field? Set by the first twin to mount and
 * never reset, so the crop grows out of the soil once and then simply stands
 * there as the farmer moves between pages. See the note at its read site.
 */
let fieldSeenThisVisit = false;

/* -------------------------------------------------------------------------- */
/* One plant, standing up out of the soil.                                    */
/* `rotateX(-90deg)` lifts the sprite off the ground plane so it is genuinely  */
/* perpendicular to the land in world space; the camera does the foreshorten-  */
/* ing. The sway lives on an inner span so the standing rotation and the       */
/* growth clip never fight over `transform`.                                  */
/* -------------------------------------------------------------------------- */
function Plant({
  plot,
  x,
  y,
  h,
  seed,
  delay,
  grown = false,
}: {
  plot: Plot;
  x: number;
  y: number;
  h: number;
  seed: number;
  delay: number;
  /** Already standing — this is the same field the farmer was just looking at. */
  grown?: boolean;
}) {
  const { top, side, head, form } = plot;
  const stem = `linear-gradient(to top, ${side}, ${top})`;
  const w = form === 'tree' ? 20 : form === 'bush' || form === 'fibre' ? 15 : form === 'tuber' ? 17 : 11;
  const leaf = (i: number, angle: number, len: number, thick: number, radius: string) => (
    <span
      key={i}
      style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        width: thick,
        height: len,
        borderRadius: radius,
        background: stem,
        transformOrigin: '50% 100%',
        transform: `translateX(-50%) rotate(${angle}deg)`,
      }}
    />
  );

  let body: React.ReactNode = null;

  if (form === 'cereal') {
    body = (
      <>
        {leaf(0, -13, h * 0.74, 2, '2px 2px 0 0')}
        {leaf(1, 12, h * 0.68, 2, '2px 2px 0 0')}
        {leaf(2, 0, h, 2.4, '2px 2px 0 0')}
        <span
          style={{
            position: 'absolute',
            bottom: h * 0.92,
            left: '50%',
            width: 4.5,
            height: h * 0.3,
            transform: 'translateX(-50%)',
            borderRadius: '3px 3px 2px 2px',
            background: `linear-gradient(to top, ${head}, #FFF6DC)`,
            boxShadow: `0 0 5px ${head}`,
          }}
        />
      </>
    );
  } else if (form === 'cane') {
    body = (
      <>
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            width: 3,
            height: h,
            transform: 'translateX(-50%)',
            borderRadius: 2,
            background: stem,
            backgroundImage: `repeating-linear-gradient(to top, rgba(0,0,0,0.16) 0 1px, transparent 1px 6px), ${stem}`,
          }}
        />
        {leaf(1, -34, h * 0.42, 1.6, '2px')}
        {leaf(2, 30, h * 0.38, 1.6, '2px')}
        <span
          style={{
            position: 'absolute',
            bottom: h * 0.9,
            left: '50%',
            width: 9,
            height: h * 0.22,
            transform: 'translateX(-50%)',
            borderRadius: '50% 50% 40% 40%',
            background: head,
            opacity: 0.85,
            filter: 'blur(0.4px)',
          }}
        />
      </>
    );
  } else if (form === 'tree') {
    body = (
      <>
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            width: 3.4,
            height: h * 0.62,
            transform: 'translateX(-50%)',
            borderRadius: 2,
            background: stem,
          }}
        />
        {[-52, -22, 22, 52].map((a, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              bottom: h * 0.55,
              left: '50%',
              width: 5,
              height: h * 0.44,
              borderRadius: '60% 60% 30% 30%',
              background: i % 2 ? side : top,
              transformOrigin: '50% 100%',
              transform: `translateX(-50%) rotate(${a}deg)`,
            }}
          />
        ))}
        <span
          style={{
            position: 'absolute',
            bottom: h * 0.5,
            left: '52%',
            width: 4,
            height: 7,
            borderRadius: 3,
            background: head,
          }}
        />
      </>
    );
  } else if (form === 'tuber') {
    body = (
      <>
        {leaf(0, -46, h * 0.86, 3, '60% 60% 20% 20%')}
        {leaf(1, -16, h, 3, '60% 60% 20% 20%')}
        {leaf(2, 18, h * 0.94, 3, '60% 60% 20% 20%')}
        {leaf(3, 48, h * 0.8, 3, '60% 60% 20% 20%')}
        <span
          style={{
            position: 'absolute',
            bottom: h * 0.74,
            left: '46%',
            width: 3,
            height: 3,
            borderRadius: 3,
            background: head,
          }}
        />
      </>
    );
  } else {
    // bush + fibre — pulses, vegetables, oilseeds, cotton
    const fruit = form === 'fibre' ? 3 : 2;
    body = (
      <>
        <span
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            width: 2,
            height: h * 0.5,
            transform: 'translateX(-50%)',
            background: stem,
          }}
        />
        {[-38, -12, 14, 40].map((a, i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              bottom: h * 0.28,
              left: '50%',
              width: 4.5,
              height: h * 0.6,
              borderRadius: '60% 60% 40% 40%',
              background: i % 2 ? side : top,
              transformOrigin: '50% 100%',
              transform: `translateX(-50%) rotate(${a}deg)`,
            }}
          />
        ))}
        {Array.from({ length: fruit }).map((_, i) => (
          <span
            key={`f${i}`}
            style={{
              position: 'absolute',
              bottom: h * (0.5 + i * 0.16),
              left: `${38 + i * 22}%`,
              width: form === 'fibre' ? 4.5 : 3.6,
              height: form === 'fibre' ? 4.5 : 3.6,
              borderRadius: 5,
              background: head,
              boxShadow: form === 'fibre' ? '0 0 4px rgba(255,255,255,0.9)' : undefined,
            }}
          />
        ))}
      </>
    );
  }

  return (
    <span
      className={grown ? undefined : 'twin-stand'}
      aria-hidden
      style={{
        position: 'absolute',
        left: `${x}%`,
        bottom: `${y}%`,
        width: w,
        height: h,
        marginLeft: -w / 2,
        transformOrigin: '50% 100%',
        transform: 'rotateX(-90deg)',
        animationDelay: grown ? undefined : `${delay}s`,
        pointerEvents: 'none',
      }}
    >
      <span
        className={seed % 2 ? 'animate-sway-b' : 'animate-sway-a'}
        style={{ position: 'absolute', inset: 0, animationDelay: `${(seed % 5) * 0.7}s` }}
      >
        {body}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* THE TWIN                                                                   */
/* -------------------------------------------------------------------------- */
export function FarmDigitalTwin({
  decision,
  className = '',
  height = 460,
  interactive = true,
  scanning = false,
  selectedCrop = null,
  onSelectCrop,
  showWeather = true,
  compact = false,
  aiState,
  showDetailCard = true,
  camera = 'auto',
}: FarmDigitalTwinProps) {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const reduced = usePrefersReducedMotion();
  const touch = useIsTouch();

  const [viewRef, inView] = useInView<HTMLDivElement>(VIEW_OPTS);
  const { ref: stageRef, value: pointer } = usePointerField<HTMLDivElement>();
  const [moteHostRef, moteSize] = useElementSize<HTMLDivElement>();
  const boardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hovered, setHovered] = useState<string | null>(null);
  const [ownSelected, setOwnSelected] = useState<string | null>(null);
  const [waterHot, setWaterHot] = useState(false);
  const [card, setCard] = useState<'none' | 'water' | 'ai'>('none');

  /**
   * CONTINUITY: the crop only grows out of the soil the first time the farmer
   * sees this field. The same twin is the centrepiece of the login hero, the
   * details page, the analysis cinematic, the plan and the Sentinel — replanting
   * it on every page would read as five different farms instead of one place
   * the farmer keeps walking back into. Module-scoped on purpose: it is a fact
   * about the visit, not about any one mounted instance.
   */
  const [growFromSoil] = useState(() => !fieldSeenThisVisit);
  useEffect(() => {
    fieldSeenThisVisit = true;
  }, []);
  const fieldAlreadyGrown = !growFromSoil;

  const selected = onSelectCrop ? selectedCrop : ownSelected;
  const setSelected = useCallback(
    (name: string | null) => {
      setCard('none');
      if (onSelectCrop) onSelectCrop(name);
      else setOwnSelected(name);
    },
    [onSelectCrop]
  );

  /* Weaker hardware gets fewer plants and fewer motes. Read once. */
  const [lowPower] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    const cores = navigator.hardwareConcurrency;
    return typeof cores === 'number' && cores > 0 && cores <= 4;
  });
  const dense = !compact && !lowPower;

  /* ---------------------------------------------------------------- plots */
  const plots: Plot[] = useMemo(() => {
    const allocated = decision?.allocated_crops ?? [];
    const live = allocated.length > 0;

    const base = live
      ? allocated.map((c) => ({
          name: c.crop_name || 'Crop',
          share: Math.max(0, typeof c.acre_share_pct === 'number' ? c.acre_share_pct : 0),
          acres: typeof c.allocated_acres === 'number' ? c.allocated_acres : 0,
          yieldQ: typeof c.expected_yield_qtl_acre === 'number' ? c.expected_yield_qtl_acre : 0,
          roi: typeof c.roi_pct === 'number' ? c.roi_pct : 0,
          profit: typeof c.net_profit_inr === 'number' ? c.net_profit_inr : 0,
          risk: typeof c.risk_score === 'number' ? c.risk_score : 20,
          reason: c.reasons?.[0] ?? '',
        }))
      : DEMO_PLOTS.map((d) => ({
          name: d.name,
          share: d.share,
          acres: 0,
          yieldQ: 0,
          roi: 0,
          profit: 0,
          risk: 0,
          reason: '',
        }));

    /* Land the optimiser deliberately left unplanted is part of the plan, so
       the twin shows it as bare soil rather than quietly rescaling it away. */
    const planted = base.reduce((s, c) => s + c.share, 0);
    const fallowPct = live ? Math.max(0, Math.min(60, 100 - planted)) : 0;
    const entries = [...base];
    if (fallowPct > 1.5) {
      entries.push({
        name: isHi ? 'परती' : 'Fallow',
        share: fallowPct,
        acres: decision?.farm_totals?.fallow_acres ?? 0,
        yieldQ: 0,
        roi: 0,
        profit: 0,
        risk: 0,
        reason: '',
      });
    }

    /* A sliver of a plot still has to be clickable, so floor the width then
       renormalise — the label always carries the true acreage. */
    const floored = entries.map((e) => Math.max(entries.length > 4 ? 7 : 9, e.share));
    const sum = floored.reduce((s, w) => s + w, 0) || 1;
    let cursor = 0;

    return entries.map((e, i) => {
      const width = (floored[i] / sum) * 100;
      const left = cursor;
      cursor += width;
      const isFallow = live && fallowPct > 1.5 && i === entries.length - 1;
      const v = cropVisual(e.name);
      const st = cropStand(e.name);
      return {
        key: `${e.name}-${i}`,
        name: e.name,
        tag: String.fromCharCode(65 + i),
        left,
        width,
        acres: e.acres,
        yieldQ: e.yieldQ,
        roi: e.roi,
        profit: e.profit,
        risk: e.risk,
        reason: e.reason,
        top: isFallow ? '#C8BC9A' : v.topLight,
        side: isFallow ? '#A2926F' : v.sideLight,
        head: st.head,
        form: st.form,
        standH: st.height,
        spacing: st.spacing,
        fallow: isFallow,
      };
    });
  }, [decision, isHi]);

  const strata = useMemo(
    () => strataStack(soilFamily(decision?.location?.major_soil_type), 9),
    [decision]
  );
  const surfaceSoil = useMemo(
    () => mix(soilFamily(decision?.location?.major_soil_type)[1], '#E9E1C6', 0.44),
    [decision]
  );

  /* The AI plants its signal in the plot it is most confident about. */
  const aiPlot = useMemo(() => {
    const planted = plots.filter((p) => !p.fallow);
    if (planted.length === 0) return plots[0];
    return planted.reduce((best, p) => (p.roi > best.roi ? p : best), planted[0]);
  }, [plots]);

  const state: TwinAiState = aiState ?? (scanning ? 'analyzing' : decision ? 'complete' : 'idle');
  const busy = state === 'analyzing' || state === 'planning';

  const active = plots.find((p) => p.name === selected) ?? null;
  const hot = plots.find((p) => p.name === hovered) ?? null;
  const focus = hot ?? active;

  /* --------------------------------------------------------------- camera */
  const eased = useRef({ x: 0, y: 0 });
  const locked = camera === 'locked';
  const parallax = !locked && interactive && !reduced && !touch;
  const ambient = !locked && !reduced && (touch || !interactive);

  /* -------------------------------------------------------------- pollen  */
  const motes = useRef<Array<{ x: number; y: number; r: number; sp: number; ph: number }>>([]);
  const sprite = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (reduced || !showWeather) return;
    const cv = canvasRef.current;
    const { width, height: h } = moteSize;
    if (!cv || width < 40 || h < 40) return;

    const dpr = Math.min(2, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1);
    cv.width = Math.round(width * dpr);
    cv.height = Math.round(h * dpr);
    const ctx = cv.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    if (!sprite.current) {
      const s = document.createElement('canvas');
      s.width = 16;
      s.height = 16;
      const sc = s.getContext('2d');
      if (sc) {
        const g = sc.createRadialGradient(8, 8, 0, 8, 8, 8);
        g.addColorStop(0, 'rgba(255,247,214,0.95)');
        g.addColorStop(0.45, 'rgba(250,226,160,0.42)');
        g.addColorStop(1, 'rgba(250,226,160,0)');
        sc.fillStyle = g;
        sc.fillRect(0, 0, 16, 16);
      }
      sprite.current = s;
    }

    const count = Math.min(dense ? 52 : 24, Math.round((width * h) / (dense ? 7200 : 15000)));
    motes.current = Array.from({ length: Math.max(8, count) }, () => ({
      x: Math.random() * width,
      y: Math.random() * h,
      r: 2 + Math.random() * 5,
      sp: 5 + Math.random() * 16,
      ph: Math.random() * Math.PI * 2,
    }));
  }, [moteSize, reduced, showWeather, dense]);

  /* ------------------------------------------------------- one rAF, both  */
  useRafLoop(
    (dt, t) => {
      const board = boardRef.current;
      const stage = stageRef.current;
      if (board) {
        let rx = CAM_RX;
        let rz = CAM_RZ;
        if (parallax) {
          eased.current.x += (pointer.current.x - eased.current.x) * 0.055;
          eased.current.y += (pointer.current.y - eased.current.y) * 0.055;
          rx = CAM_RX - eased.current.y * 6.5;
          rz = CAM_RZ + eased.current.x * 7;
        } else if (ambient) {
          /* Touch and passive views get a slow drift instead of a cursor —
             gentle, and it never competes with a scroll gesture. */
          rx = CAM_RX + Math.sin(t * 0.13) * 1.5;
          rz = CAM_RZ + Math.sin(t * 0.09) * 2.4;
        }
        board.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
        if (stage) {
          stage.style.setProperty(
            '--tw-bb',
            `rotateZ(${(-rz).toFixed(2)}deg) rotateX(${(-rx).toFixed(2)}deg)`
          );
        }
      }

      const cv = canvasRef.current;
      const spr = sprite.current;
      if (cv && spr && motes.current.length) {
        const ctx = cv.getContext('2d');
        const w = moteSize.width;
        const h = moteSize.height;
        if (ctx && w > 0) {
          ctx.clearRect(0, 0, w, h);
          for (const m of motes.current) {
            m.y -= m.sp * dt;
            m.x += Math.sin(t * 0.5 + m.ph) * 10 * dt;
            if (m.y < -12) {
              m.y = h + 10;
              m.x = Math.random() * w;
            }
            if (m.x < -12) m.x = w + 8;
            if (m.x > w + 12) m.x = -8;
            ctx.drawImage(spr, m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
          }
        }
      }
    },
    inView && (parallax || ambient || (!reduced && showWeather))
  );

  /* Static camera when nothing is animating it. */
  useEffect(() => {
    if (parallax || ambient) return;
    const board = boardRef.current;
    if (board) board.style.transform = `rotateX(${CAM_RX}deg) rotateZ(${CAM_RZ}deg)`;
  }, [parallax, ambient]);

  /* Escape closes whatever is open. */
  useEffect(() => {
    if (!interactive) return;
    if (card === 'none' && !selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (card !== 'none') setCard('none');
      else setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, selected, interactive, setSelected]);

  /* ------------------------------------------------------------ read-outs */
  const rain7 = decision?.weather?.forecast_rain_7d_total_mm ?? 0;
  const showRain = showWeather && rain7 > 40;
  const irrigation = decision?.request?.irrigation_type ?? null;
  const reliability = decision?.request?.irrigation_reliability ?? null;
  const buffer = decision?.risk?.irrigation_buffer_pct ?? null;
  const headline = decision?.explanation?.headline ?? null;
  const waterNote = decision?.explanation?.irrigation_impact ?? null;
  const plantBase = compact ? 24 : 34;

  const stateWord = isHi
    ? { idle: 'तैयार', listening: 'सुन रहा है', analyzing: 'विश्लेषण', planning: 'योजना बना रहा है', complete: 'योजना तैयार' }[state]
    : { idle: 'Standing by', listening: 'Listening', analyzing: 'Analyzing', planning: 'Planning', complete: 'Plan ready' }[state];

  const cardShell =
    'panel-glass pointer-events-auto absolute z-20 w-[15.5rem] max-w-[86%] p-3.5 text-left animate-scale-in';

  return (
    <div
      ref={viewRef}
      className={`relative select-none ${className}`}
      style={{ height }}
      role="group"
      aria-label={
        isHi
          ? `डिजिटल फार्म ट्विन — ${plots.length} खेत`
          : `Digital farm twin — ${plots.length} plots`
      }
    >
      <div
        ref={stageRef}
        className="absolute inset-0"
        style={{ perspective: '1500px', ['--tw-bb' as string]: BILLBOARD_REST }}
      >
        {/* ================= sky, sun, weather (screen space) ============== */}
        {showWeather && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(120% 90% at 76% 4%, var(--glow-sun) 0%, transparent 46%), linear-gradient(to bottom, var(--twin-sky-top), var(--twin-sky-bot) 62%, transparent)',
                opacity: 0.75,
              }}
            />
            <div className="animate-sun-drift absolute right-[11%] top-[7%]">
              <span
                className="block h-14 w-14 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 42% 38%, #FFFDF2, #F6D689 52%, rgba(240,200,102,0) 76%)',
                  boxShadow: '0 0 54px rgba(246,214,137,0.65)',
                }}
              />
            </div>
            {[
              { l: '9%', t: '14%', s: 1, o: 0.66 },
              { l: '54%', t: '8%', s: 0.66, o: 0.5 },
              { l: '31%', t: '22%', s: 0.44, o: 0.36 },
            ].map((c, i) => (
              <div
                key={i}
                className="animate-drift absolute rounded-full bg-white blur-md"
                style={{
                  left: c.l,
                  top: c.t,
                  width: 132 * c.s,
                  height: 34 * c.s,
                  opacity: c.o,
                  animationDelay: `${i * -5.5}s`,
                }}
              />
            ))}
            {showRain &&
              Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={i}
                  className="rain-drop absolute w-[1.5px] rounded-full"
                  style={{
                    left: `${10 + ((i * 5.2) % 80)}%`,
                    top: `${18 + (i % 4) * 6}%`,
                    height: 14,
                    background: 'linear-gradient(var(--twin-water), transparent)',
                    animationDelay: `${(i % 6) * 0.18}s`,
                    opacity: 0.55,
                  }}
                />
              ))}
          </div>
        )}

        {/* pollen and dust in the light */}
        {!reduced && showWeather && (
          <div ref={moteHostRef} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <canvas ref={canvasRef} className="h-full w-full" />
          </div>
        )}

        {/* the AI's sweep passes over the whole farm, in screen space, so it
            never slices through the standing crop */}
        {busy && !reduced && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div
              className="twin-scan absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, transparent, rgba(255,255,255,0.72) 46%, var(--field-bright) 52%, rgba(255,255,255,0.5) 58%, transparent)',
                opacity: 0.5,
              }}
            />
          </div>
        )}

        {/* ===================== the land ================================= */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            ref={boardRef}
            style={{
              width: '84%',
              height: '56%',
              transform: `rotateX(${CAM_RX}deg) rotateZ(${CAM_RZ}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className={reduced ? '' : 'animate-earth-breathe'}
              style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}
            >
              {/* the earth block, tinted by the district's real soil */}
              {strata.map((c, i) => (
                <div
                  key={i}
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 13,
                    background: c,
                    transform: `translateZ(${-(i + 1) * 4.4}px)`,
                    boxShadow:
                      i === strata.length - 1
                        ? '0 26px 44px rgb(var(--sh-color) / 0.3)'
                        : 'inset 0 -1px 0 rgba(0,0,0,0.12)',
                  }}
                />
              ))}

              {/* ploughed surface between the bunds */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 13,
                  background: surfaceSoil,
                  boxShadow: `inset 0 0 0 1px var(--twin-edge), inset 0 0 34px rgb(var(--sh-color) / 0.16)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* --------------------------- the plots ----------------- */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 7,
                    bottom: 15,
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {plots.map((p, idx) => {
                    const isActive = active?.name === p.name;
                    const isHot = hovered === p.name;
                    const lift = isActive ? 20 : isHot ? 9 : 0;
                    const rows = Math.max(4, Math.round(9 / p.spacing));
                    const plantCount = p.fallow
                      ? 0
                      : Math.max(2, Math.round(((dense ? 22 : 12) * p.width) / 100));
                    const h = Math.round(plantBase * p.standH);

                    return (
                      <div
                        key={p.key}
                        style={{
                          position: 'absolute',
                          left: `${p.left}%`,
                          width: `${p.width}%`,
                          top: 0,
                          bottom: 0,
                          transformStyle: 'preserve-3d',
                          transform: `translateZ(${lift}px)`,
                          transition: reduced ? undefined : 'transform 520ms var(--ease-spring)',
                        }}
                      >
                        {/* the plot surface — flat, so it can safely clip. The
                            1.5px gap on each side is the bund between plots. */}
                        <div
                          className="overflow-hidden"
                          style={{
                            position: 'absolute',
                            inset: '0 1.5px',
                            borderRadius: 4,
                            background: `linear-gradient(158deg, ${p.top}, ${p.side})`,
                            boxShadow: isActive
                              ? `inset 0 0 0 1.5px var(--grain-bright), 0 0 26px var(--glow-grain)`
                              : 'inset 0 0 0 1px rgba(255,255,255,0.28), inset 0 -6px 12px rgba(40,30,12,0.14)',
                            filter: isActive
                              ? 'saturate(1.12) brightness(1.08)'
                              : isHot
                              ? 'saturate(1.06) brightness(1.04)'
                              : undefined,
                            transition: reduced ? undefined : 'filter 320ms ease, box-shadow 320ms ease',
                          }}
                        >
                          {/* ploughed rows — direction alternates plot to plot,
                              the way adjacent plots really are worked */}
                          <span
                            style={{
                              position: 'absolute',
                              inset: 0,
                              opacity: p.fallow ? 0.5 : 0.42,
                              backgroundImage: `repeating-linear-gradient(${
                                idx % 2 ? 90 : 0
                              }deg, rgba(255,255,255,0.22) 0 1px, transparent 1px ${
                                rows - 1
                              }px, rgba(40,30,12,0.2) ${rows - 1}px ${rows}px)`,
                            }}
                          />
                          {/* sunlight travelling across the land */}
                          <span
                            className={reduced ? '' : 'twin-light'}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundImage:
                                'radial-gradient(60% 50% at 30% 12%, rgba(255,250,226,0.5), transparent 62%)',
                            }}
                          />
                          {interactive && (
                            <button
                              type="button"
                              onClick={() => setSelected(isActive ? null : p.name)}
                              onMouseEnter={() => setHovered(p.name)}
                              onMouseLeave={() =>
                                setHovered((cur) => (cur === p.name ? null : cur))
                              }
                              onFocus={() => setHovered(p.name)}
                              onBlur={() => setHovered((cur) => (cur === p.name ? null : cur))}
                              aria-pressed={isActive}
                              aria-label={[
                                isHi ? `खेत ${p.tag}` : `Field ${p.tag}`,
                                p.name,
                                p.acres ? `${p.acres.toFixed(1)} ${isHi ? 'एकड़' : 'acres'}` : '',
                                decision && !p.fallow
                                  ? conditionOf(p.risk, isHi).label
                                  : '',
                              ]
                                .filter(Boolean)
                                .join(', ')}
                              style={{
                                position: 'absolute',
                                inset: 0,
                                cursor: 'pointer',
                                background: 'transparent',
                                border: 0,
                                padding: 0,
                                outline: 'none',
                              }}
                            />
                          )}
                        </div>

                        {/* the crop, standing */}
                        {Array.from({ length: plantCount }).map((_, i) => {
                          const seed = idx * 7 + i * 3;
                          return (
                            <Plant
                              key={i}
                              plot={p}
                              x={8 + ((i * 79) % 84)}
                              y={9 + ((i * 37) % 70)}
                              h={h}
                              seed={seed}
                              delay={reduced ? 0 : 0.2 + i * 0.035 + idx * 0.06}
                              grown={fieldAlreadyGrown}
                            />
                          );
                        })}
                      </div>
                    );
                  })}

                {/* ------------------- irrigation: channel + laterals ---- */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: -11,
                    height: 8,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: `linear-gradient(to bottom, #A8D3E4, var(--twin-water))`,
                    boxShadow: waterHot
                      ? '0 0 18px rgba(127,184,206,0.75), inset 0 1px 0 rgba(255,255,255,0.8)'
                      : 'inset 0 1px 0 rgba(255,255,255,0.6)',
                    transform: 'translateZ(0.6px)',
                    transition: reduced ? undefined : 'box-shadow 300ms ease',
                  }}
                >
                  <span
                    className={reduced ? '' : waterHot ? 'twin-flow' : 'twin-flow-calm'}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: waterHot ? 0.95 : 0.5,
                      backgroundImage:
                        'repeating-linear-gradient(90deg, rgba(255,255,255,0.62) 0 3px, transparent 3px 14px)',
                      transition: reduced ? undefined : 'opacity 300ms ease',
                    }}
                  />
                </div>

                {/* laterals rising between the plots */}
                {plots.slice(1).map((p, i) => (
                  <div
                    key={`lat-${p.key}`}
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: `calc(${p.left}% - 1px)`,
                      bottom: -5,
                      top: '30%',
                      width: 2,
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: waterHot
                        ? 'linear-gradient(to top, var(--twin-water), rgba(168,211,228,0.35))'
                        : 'rgba(146,190,209,0.34)',
                      transform: 'translateZ(0.7px)',
                      transition: reduced ? undefined : 'background 300ms ease',
                    }}
                  >
                    {waterHot &&
                      !reduced &&
                      Array.from({ length: 3 }).map((_, d) => (
                        <span
                          key={d}
                          className="twin-drop"
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: -1,
                            width: 4,
                            height: 4,
                            borderRadius: 4,
                            background: '#EAF6FB',
                            boxShadow: '0 0 6px rgba(127,184,206,0.9)',
                            animationDelay: `${d * 0.5 + i * 0.17}s`,
                          }}
                        />
                      ))}
                  </div>
                ))}

                {interactive && (
                  <button
                    type="button"
                    onMouseEnter={() => setWaterHot(true)}
                    onMouseLeave={() => setWaterHot(false)}
                    onFocus={() => setWaterHot(true)}
                    onBlur={() => setWaterHot(false)}
                    onClick={() => {
                      setCard((c) => (c === 'water' ? 'none' : 'water'));
                      if (onSelectCrop) onSelectCrop(null);
                      else setOwnSelected(null);
                    }}
                    aria-label={
                      isHi
                        ? `सिंचाई${irrigation ? ` — ${irrigation}` : ''}`
                        : `Irrigation${irrigation ? ` — ${irrigation}` : ''}`
                    }
                    style={{
                      position: 'absolute',
                      left: -3,
                      right: -3,
                      bottom: -14,
                      height: 20,
                      cursor: 'pointer',
                      background: 'transparent',
                      border: 0,
                      padding: 0,
                      outline: 'none',
                      transform: 'translateZ(1.4px)',
                    }}
                  />
                )}

                {/* ------------------- the AI, standing in the field ----- */}
                {aiPlot && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${aiPlot.left + aiPlot.width / 2}%`,
                      top: '34%',
                      transformStyle: 'preserve-3d',
                      transform: 'translateZ(1px)',
                    }}
                  >
                    {/* the mast is perpendicular to the land, like the crop */}
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        left: -1,
                        bottom: 0,
                        width: 2,
                        height: compact ? 30 : 44,
                        transformOrigin: '50% 100%',
                        transform: 'rotateX(-90deg)',
                        background:
                          'linear-gradient(to top, rgba(28,83,53,0.18), var(--field-bright))',
                        borderRadius: 2,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        transform: `translate(-50%, -50%) translateZ(${
                          compact ? 30 : 44
                        }px) var(--tw-bb)`,
                      }}
                    >
                      <button
                        type="button"
                        disabled={!interactive}
                        onClick={() => {
                          setCard((c) => (c === 'ai' ? 'none' : 'ai'));
                          if (onSelectCrop) onSelectCrop(null);
                          else setOwnSelected(null);
                        }}
                        aria-label={
                          isHi ? `AgriOptima AI — ${stateWord}` : `AgriOptima AI — ${stateWord}`
                        }
                        className="group relative grid place-items-center"
                        style={{
                          width: 34,
                          height: 34,
                          border: 0,
                          background: 'transparent',
                          padding: 0,
                          cursor: interactive ? 'pointer' : 'default',
                          outline: 'none',
                        }}
                      >
                        {!reduced &&
                          [0, 1].map((r) => (
                            <span
                              key={r}
                              className="twin-ripple absolute inset-0 rounded-full"
                              style={{
                                border: `1.5px solid ${
                                  state === 'complete' ? 'var(--grain)' : 'var(--field-bright)'
                                }`,
                                animationDelay: `${r * 1.3}s`,
                                animationDuration: busy ? '1.5s' : '2.9s',
                              }}
                              aria-hidden
                            />
                          ))}
                        <span
                          className="relative grid place-items-center rounded-full text-white transition-transform duration-300 group-hover:scale-110"
                          style={{
                            width: 20,
                            height: 20,
                            background:
                              state === 'complete'
                                ? 'linear-gradient(140deg, var(--grain-bright), var(--grain))'
                                : 'linear-gradient(140deg, var(--field-bright), var(--field-deep))',
                            boxShadow: `0 4px 12px rgb(var(--sh-color) / 0.3), 0 0 0 3px ${
                              state === 'complete' ? 'var(--grain-tint)' : 'var(--field-tint)'
                            }`,
                          }}
                        >
                          <Sparkles size={11} />
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ------------------- the floating plot label ----------- */}
                {focus && (
                  <div
                    className="pointer-events-none"
                    style={{
                      position: 'absolute',
                      left: `${focus.left + focus.width / 2}%`,
                      top: '46%',
                      transform: `translate(-50%, -100%) translateZ(${
                        compact ? 46 : 62
                      }px) var(--tw-bb)`,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <div className="animate-scale-in whitespace-nowrap rounded-xl bg-[rgb(255_255_255_/_0.9)] px-2.5 py-1.5 text-left shadow-[0_10px_28px_rgb(var(--sh-color)/0.18)] backdrop-blur-sm">
                      <span className="font-data block text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-ghost)]">
                        {isHi ? `खेत ${focus.tag}` : `Field ${focus.tag}`}
                      </span>
                      <span className="block text-[12px] font-semibold leading-tight text-[var(--ink)]">
                        {focus.name}
                      </span>
                      <span
                        className="mt-0.5 flex items-center gap-1 text-[10px] font-medium"
                        style={{
                          color:
                            decision && !focus.fallow
                              ? conditionOf(focus.risk, isHi).tone
                              : 'var(--ink-faint)',
                        }}
                      >
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{
                            background:
                              decision && !focus.fallow
                                ? conditionOf(focus.risk, isHi).tone
                                : 'var(--sage)',
                          }}
                        />
                        {focus.fallow
                          ? isHi
                            ? 'बिना बोया'
                            : 'Left unplanted'
                          : decision
                          ? conditionOf(focus.risk, isHi).label
                          : isHi
                          ? 'पूर्वावलोकन'
                          : 'Preview'}
                      </span>
                    </div>
                  </div>
                )}

                {/* ------------------- irrigation label ------------------ */}
                {waterHot && (
                  <div
                    className="pointer-events-none"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      bottom: -9,
                      transform: `translate(-50%, 0) translateZ(30px) var(--tw-bb)`,
                    }}
                  >
                    <div className="animate-scale-in flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[rgb(255_255_255_/_0.92)] px-2.5 py-1 shadow-[0_8px_22px_rgb(var(--sh-color)/0.18)]">
                      <Droplets size={11} className="text-[var(--sky)]" />
                      <span className="text-[10px] font-semibold text-[var(--ink)]">
                        {irrigation
                          ? `${irrigation}${reliability ? ` · ${reliability}` : ''}`
                          : isHi
                          ? 'सिंचाई नहर'
                          : 'Irrigation channel'}
                      </span>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ground contact shadow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[73%] h-9 w-[60%] -translate-x-1/2 rounded-[50%] blur-2xl"
          style={{ background: 'rgb(var(--sh-color) / 0.24)' }}
        />

        {/* =================== contextual cards ========================== */}
        {interactive && showDetailCard && active && (
          <div
            className={cardShell}
            style={{
              left: `${Math.min(82, Math.max(18, active.left + active.width / 2))}%`,
              top: '3%',
              transform: 'translateX(-50%)',
            }}
            role="group"
            aria-label={active.name}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-data block text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-ghost)]">
                  {isHi ? `खेत ${active.tag}` : `Field ${active.tag}`}
                </span>
                <span className="font-display block text-[15px] font-medium leading-tight text-[var(--ink)]">
                  {active.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[var(--ink-faint)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]"
                aria-label={isHi ? 'बंद करें' : 'Close'}
              >
                <X size={13} />
              </button>
            </div>

            {active.fallow ? (
              <p className="mt-2 text-[11px] leading-relaxed text-[var(--ink-soft)]">
                {active.acres > 0
                  ? isHi
                    ? `${active.acres.toFixed(1)} एकड़ इस मौसम में बिना बोया छोड़ा गया है।`
                    : `${active.acres.toFixed(1)} acres held back this season.`
                  : isHi
                  ? 'इस मौसम में बिना बोया।'
                  : 'Held back this season.'}
              </p>
            ) : decision ? (
              <>
                <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2">
                  {[
                    {
                      k: isHi ? 'क्षेत्र' : 'Area',
                      v: `${active.acres.toFixed(1)} ${isHi ? 'एकड़' : 'ac'}`,
                    },
                    {
                      k: isHi ? 'उपज' : 'Yield',
                      v: `${active.yieldQ.toFixed(1)} ${isHi ? 'क्वि/एकड़' : 'qtl/ac'}`,
                    },
                    { k: isHi ? 'लाभ' : 'Net profit', v: lakh(active.profit, isHi) },
                    { k: 'ROI', v: `${Math.round(active.roi)}%` },
                  ].map((row) => (
                    <div key={row.k}>
                      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-ghost)]">
                        {row.k}
                      </dt>
                      <dd className="font-data text-[13px] font-semibold text-[var(--ink)]">
                        {row.v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: conditionOf(active.risk, isHi).tone }}
                  />
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: conditionOf(active.risk, isHi).tone }}
                  >
                    {conditionOf(active.risk, isHi).label}
                  </span>
                  <span className="font-data text-[10px] text-[var(--ink-ghost)]">
                    {isHi ? 'जोखिम' : 'risk'} {Math.round(active.risk)}
                  </span>
                </div>
                {active.reason && (
                  <p className="mt-2 border-t border-[var(--line-soft)] pt-2 text-[11px] leading-relaxed text-[var(--ink-soft)]">
                    {active.reason}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-[11px] leading-relaxed text-[var(--ink-soft)]">
                {isHi
                  ? 'यह एक पूर्वावलोकन खेत है। योजना बनने पर यहाँ आपके असली आंकड़े दिखेंगे।'
                  : 'A preview plot. Your own numbers appear here once the plan is generated.'}
              </p>
            )}
          </div>
        )}

        {interactive && card === 'water' && (
          <div
            className={cardShell}
            style={{ left: '50%', bottom: '4%', transform: 'translateX(-50%)' }}
            role="group"
            aria-label={isHi ? 'सिंचाई' : 'Irrigation'}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--sky-tint)] text-[var(--sky)]">
                  <Droplets size={12} />
                </span>
                <span className="font-display text-[13px] font-medium text-[var(--ink)]">
                  {irrigation
                    ? `${irrigation}${reliability ? ` · ${reliability}` : ''}`
                    : isHi
                    ? 'सिंचाई'
                    : 'Irrigation'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setCard('none')}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[var(--ink-faint)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]"
                aria-label={isHi ? 'बंद करें' : 'Close'}
              >
                <X size={13} />
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--ink-soft)]">
              {waterNote ||
                (isHi
                  ? 'नहर खेतों के बीच की नालियों में पानी पहुँचाती है।'
                  : 'The channel feeds laterals running between the plots.')}
            </p>
            {buffer !== null && (
              <p className="font-data mt-2 text-[10px] text-[var(--ink-ghost)]">
                {isHi ? 'सिंचाई बफ़र' : 'Irrigation buffer'} · {Math.round(buffer)}%
              </p>
            )}
          </div>
        )}

        {interactive && card === 'ai' && (
          <div
            className={cardShell}
            style={{ left: '50%', top: '3%', transform: 'translateX(-50%)' }}
            role="group"
            aria-label="AgriOptima AI"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex items-center gap-2">
                <span
                  className="grid h-6 w-6 place-items-center rounded-full text-white"
                  style={{
                    background:
                      state === 'complete'
                        ? 'linear-gradient(140deg, var(--grain-bright), var(--grain))'
                        : 'linear-gradient(140deg, var(--field-bright), var(--field-deep))',
                  }}
                >
                  <Sparkles size={11} />
                </span>
                <span>
                  <span className="font-display block text-[13px] font-medium leading-none text-[var(--ink)]">
                    AgriOptima AI
                  </span>
                  <span className="font-data text-[9px] uppercase tracking-[0.16em] text-[var(--ink-ghost)]">
                    {stateWord}
                  </span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => setCard('none')}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[var(--ink-faint)] transition-colors hover:bg-[var(--surface-sunken)] hover:text-[var(--ink)]"
                aria-label={isHi ? 'बंद करें' : 'Close'}
              >
                <X size={13} />
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--ink-soft)]">
              {headline ||
                (isHi
                  ? 'खेत का विवरण भरें — फिर मैं इस ज़मीन के लिए योजना बनाऊँगा।'
                  : 'Add your field details and I will plan this land for you.')}
            </p>
            {decision?.location?.major_soil_type && (
              <p className="font-data mt-2 text-[10px] text-[var(--ink-ghost)]">
                {isHi ? 'मिट्टी' : 'Soil'} · {decision.location.major_soil_type}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
