import React, { useEffect, useRef } from 'react';
import { usePrefersReducedMotion, useRafLoop } from '@/lib/hooks';

export type OrbState =
  | 'idle'
  | 'listening'
  | 'analyzing'
  | 'planning'
  | 'recommending'
  | 'complete';

interface AIAgentOrbProps {
  state?: OrbState;
  size?: number;
  className?: string;
  /** 0..1 live audio/interaction level for LISTENING */
  level?: number;
}

interface Palette {
  core: string;
  coreEdge: string;
  ring: string;
  gold: string;
  spark: string;
  bg: string;
}

/* One world, one palette: the core reads as a fresh leaf-green seed lit from
   above, sitting on warm ivory. */
const PALETTE: Palette = {
  core: '#46A968',
  coreEdge: '#1C5335',
  ring: 'rgba(47, 122, 79, ',
  gold: 'rgba(216, 166, 60, ',
  spark: 'rgba(28, 83, 53, ',
  bg: 'rgba(246, 244, 236, ',
};

/**
 * The AgriOptima intelligence core — a living "seed core" orb rendered on a
 * canvas. It expresses six states through motion. Signature product visual.
 * Reduced motion → a single calm static frame.
 */
export function AIAgentOrb({
  state = 'idle',
  size = 220,
  className = '',
  level = 0,
}: AIAgentOrbProps) {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateStartRef = useRef<number>(performance.now() / 1000);
  const levelRef = useRef(level);
  levelRef.current = level;

  useEffect(() => {
    stateStartRef.current = performance.now() / 1000;
  }, [state]);

  const draw = (t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + 'px';
      canvas.style.height = size + 'px';
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.2; // core radius
    const p = PALETTE;
    const elapsed = t - stateStartRef.current;
    const breathe = 1 + Math.sin(t * 1.6) * 0.05;

    // ---- outer halo -------------------------------------------------------
    const haloR = R * 2.6 * (state === 'recommending' || state === 'complete' ? 1.15 : 1) * breathe;
    const halo = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, haloR);
    const haloA = state === 'idle' ? 0.22 : 0.34;
    halo.addColorStop(0, p.ring + haloA + ')');
    halo.addColorStop(1, p.ring + '0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
    ctx.fill();

    // ---- state: analyzing — expanding scan rings + radar sweep -----------
    if (state === 'analyzing') {
      const rings = 3;
      for (let i = 0; i < rings; i++) {
        const prog = (t * 0.45 + i / rings) % 1;
        const rr = R * 1.3 + prog * R * 2.4;
        ctx.strokeStyle = p.ring + (0.5 * (1 - prog)).toFixed(3) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      // radar sweep
      const ang = t * 2.2;
      const grad = ctx.createConicGradient ? ctx.createConicGradient(ang, cx, cy) : null;
      if (grad) {
        grad.addColorStop(0, p.ring + '0.35)');
        grad.addColorStop(0.08, p.ring + '0)');
        grad.addColorStop(1, p.ring + '0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ---- state: planning — constellation nodes connecting ----------------
    if (state === 'planning') {
      const nodes = 6;
      const pts: Array<[number, number]> = [];
      for (let i = 0; i < nodes; i++) {
        const a = (i / nodes) * Math.PI * 2 + t * 0.25;
        const rr = R * 2.05;
        pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.7]);
      }
      const link = Math.min(1, elapsed * 0.9);
      ctx.strokeStyle = p.ring + '0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % nodes];
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (x1 - cx) * link, cy + (y1 - cy) * link);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + (x2 - x1) * link, y1 + (y2 - y1) * link);
        ctx.stroke();
      }
      pts.forEach(([x, y], i) => {
        const pulse = 0.6 + Math.sin(t * 3 + i) * 0.4;
        ctx.fillStyle = p.gold + (0.7 * pulse).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // ---- state: listening — responsive waveform ring ---------------------
    if (state === 'listening') {
      const bars = 40;
      const lv = 0.4 + levelRef.current * 0.6;
      for (let i = 0; i < bars; i++) {
        const a = (i / bars) * Math.PI * 2;
        const amp = (0.5 + 0.5 * Math.sin(t * 6 + i * 0.7)) * lv;
        const r1 = R * 1.35;
        const r2 = r1 + amp * R * 0.9;
        ctx.strokeStyle = p.ring + (0.25 + amp * 0.5).toFixed(3) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        ctx.stroke();
      }
    }

    // ---- orbiting rings (always, tilt varies) ----------------------------
    const ringCount = 2;
    for (let i = 0; i < ringCount; i++) {
      const rot = t * (0.5 + i * 0.35) + i * 1.2;
      const rr = R * (1.7 + i * 0.5);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.strokeStyle = p.ring + (0.28 - i * 0.08).toFixed(3) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, rr, rr * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
      // a spark travelling the ring
      const sa = t * (1.4 - i * 0.4);
      ctx.fillStyle = p.gold + '0.9)';
      ctx.beginPath();
      ctx.arc(Math.cos(sa) * rr, Math.sin(sa) * rr * 0.42, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ---- core sphere ------------------------------------------------------
    const coreScale =
      state === 'recommending'
        ? 1.12
        : state === 'complete'
          ? 1.05
          : state === 'analyzing'
            ? 1 + Math.sin(t * 5) * 0.04
            : breathe;
    const cr = R * coreScale;
    const core = ctx.createRadialGradient(cx - cr * 0.3, cy - cr * 0.35, cr * 0.15, cx, cy, cr);
    core.addColorStop(0, '#EDFBF1');
    core.addColorStop(0.5, p.core);
    core.addColorStop(1, p.coreEdge);
    ctx.fillStyle = core;
    ctx.shadowColor = p.ring + '0.8)';
    ctx.shadowBlur = state === 'idle' ? 14 : 26;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // inner seed motif (a sprouting line)
    ctx.strokeStyle = 'rgba(255,255,255,0.62)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy + cr * 0.4);
    ctx.quadraticCurveTo(cx, cy - cr * 0.1, cx, cy - cr * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - cr * 0.08);
    ctx.quadraticCurveTo(cx + cr * 0.35, cy - cr * 0.25, cx + cr * 0.42, cy - cr * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - cr * 0.08);
    ctx.quadraticCurveTo(cx - cr * 0.35, cy - cr * 0.25, cx - cr * 0.42, cy - cr * 0.5);
    ctx.stroke();

    // ---- state: recommending — focused beam ------------------------------
    if (state === 'recommending') {
      const focus = Math.min(1, elapsed * 1.2);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.5);
      const beam = ctx.createLinearGradient(0, 0, size * 0.5, 0);
      beam.addColorStop(0, p.gold + (0.4 * focus).toFixed(3) + ')');
      beam.addColorStop(1, p.gold + '0)');
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(0, -R * 0.5);
      ctx.lineTo(size * 0.5, -R * 1.3);
      ctx.lineTo(size * 0.5, R * 1.3);
      ctx.lineTo(0, R * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // ---- state: complete — settling bloom --------------------------------
    if (state === 'complete') {
      const b = Math.min(1, elapsed * 0.8);
      const bloomR = R * 1.3 + b * R * 2.2;
      ctx.strokeStyle = p.ring + ((1 - b) * 0.6).toFixed(3) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, bloomR, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  // animated
  useRafLoop((_, t) => draw(t), !reduced);
  // static frame for reduced motion / first paint
  useEffect(() => {
    if (reduced) draw(0.6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, state, size]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label={`AI agent status: ${state}`}
      style={{ width: size, height: size, display: 'block' }}
    />
  );
}
