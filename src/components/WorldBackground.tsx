import React, { useRef } from 'react';
import { usePrefersReducedMotion, useRafLoop } from '@/lib/hooks';

interface WorldBackgroundProps {
  /** 'ambient' = full atmosphere with motes; 'quiet' = gradients + contours only */
  variant?: 'ambient' | 'quiet';
  /** show the cartographic survey grid */
  survey?: boolean;
  className?: string;
}

interface Mote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
  hue: number;
}

/**
 * The persistent atmosphere behind every screen: layered gradients, drifting
 * aurora glow, faint topographic contour lines, a cartographic survey grid,
 * and a subtle canvas field of floating "pollen / data motes". Adapts to the
 * active world (Daylight / Nightfall) and fully respects reduced motion.
 */
export function WorldBackground({
  variant = 'ambient',
  survey = true,
  className = '',
}: WorldBackgroundProps) {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motesRef = useRef<Mote[]>([]);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  const active = variant === 'ambient' && !reduced;

  // (re)seed motes on mount / theme change
  const seed = () => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    c.style.width = w + 'px';
    c.style.height = h + 'px';
    sizeRef.current = { w, h, dpr };
    const count = Math.round(Math.min(46, (w * h) / 42000));
    const motes: Mote[] = [];
    for (let i = 0; i < count; i++) {
      motes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.6 + Math.random() * 2.2,
        vx: (Math.random() - 0.5) * 8,
        vy: -6 - Math.random() * 10,
        a: 0.12 + Math.random() * 0.4,
        hue: Math.random(),
      });
    }
    motesRef.current = motes;
  };

  React.useEffect(() => {
    if (!active) return;
    seed();
    const onResize = () => seed();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useRafLoop((dt) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const { w, h, dpr } = sizeRef.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    // fresh leaf green + sunlight, matching --field-bright / --grain
    const base = [70, 169, 104];
    const gold = [216, 166, 60];
    for (const m of motesRef.current) {
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      if (m.y < -10) {
        m.y = h + 10;
        m.x = Math.random() * w;
      }
      if (m.x < -10) m.x = w + 10;
      if (m.x > w + 10) m.x = -10;
      const col = m.hue > 0.72 ? gold : base;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${m.a})`;
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, active);

  return (
    <div
      className={`world-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* drifting aurora blooms */}
      <div
        className="absolute -right-[12%] -top-[14%] h-[62vh] w-[62vh] rounded-full blur-3xl animate-aurora"
        style={{
          background:
            'radial-gradient(circle, var(--glow-field) 0%, transparent 68%)',
        }}
      />
      <div
        className="absolute -bottom-[16%] -left-[10%] h-[56vh] w-[56vh] rounded-full blur-3xl animate-aurora"
        style={{
          background: 'radial-gradient(circle, var(--glow-grain) 0%, transparent 66%)',
          animationDelay: '-6s',
        }}
      />

      {/* topographic contour survey lines */}
      <div className="contour-field absolute inset-0 opacity-70" />

      {/* cartographic survey grid */}
      {survey && <div className="grid-survey absolute inset-0 opacity-60" />}

      {/* floating motes */}
      {active && <canvas ref={canvasRef} className="absolute inset-0" />}

      {/* film grain */}
      <div className="grain-noise absolute inset-0" />
    </div>
  );
}
