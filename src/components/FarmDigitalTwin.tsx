import React, { useMemo, useRef } from 'react';
import type { FarmDecisionResponse } from '@/types/farm';
import { cropVisual } from '@/lib/crops';
import { useTheme } from '@/theme/ThemeContext';
import { usePointerField, usePrefersReducedMotion, useRafLoop, useIsTouch } from '@/lib/hooks';

interface Strip {
  name: string;
  share: number; // 0..100
  acres: number;
  profit: number;
  roi: number;
  risk: number;
  top: string;
  side: string;
  emoji: string;
}

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
}

const DEMO_STRIPS: Array<{ name: string; share: number }> = [
  { name: 'Wheat', share: 42 },
  { name: 'Mustard', share: 24 },
  { name: 'Gram', share: 34 },
];

/**
 * The living farm digital twin — a stylised isometric block of cropland built
 * purely with CSS 3D transforms (no WebGL dependency). Strip fields sized by
 * the AI's acre allocation, swaying crops, soil strata edge, an irrigation
 * channel, drifting weather, an AI scan sweep, and billboarded data tags that
 * appear on hover/select. This is the object that persists across the flow.
 */
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
}: FarmDigitalTwinProps) {
  const { isDark } = useTheme();
  const reduced = usePrefersReducedMotion();
  const touch = useIsTouch();
  const boardRef = useRef<HTMLDivElement>(null);
  const { ref: stageRef, value: pointer } = usePointerField<HTMLDivElement>();
  const eased = useRef({ x: 0, y: 0 });

  const strips: Strip[] = useMemo(() => {
    const source =
      decision?.allocated_crops && decision.allocated_crops.length > 0
        ? decision.allocated_crops.map((c) => ({
            name: c.crop_name,
            share: c.acre_share_pct,
            acres: c.allocated_acres,
            profit: c.net_profit_inr,
            roi: c.roi_pct,
            risk: c.risk_score,
          }))
        : DEMO_STRIPS.map((d) => ({
            name: d.name,
            share: d.share,
            acres: 0,
            profit: 0,
            roi: 0,
            risk: 0,
          }));
    const total = source.reduce((s, c) => s + (c.share || 0), 0) || 1;
    return source.map((c) => {
      const v = cropVisual(c.name);
      return {
        name: c.name,
        share: Math.max(8, (c.share / total) * 100),
        acres: c.acres,
        profit: c.profit,
        roi: c.roi,
        risk: c.risk,
        top: isDark ? v.topDark : v.topLight,
        side: isDark ? v.sideDark : v.sideLight,
        emoji: v.emoji,
      };
    });
  }, [decision, isDark]);

  const rain7 = decision?.weather?.forecast_rain_7d_total_mm ?? 0;
  const showRain = showWeather && rain7 > 40;
  const bladesPer = compact ? 3 : 5;

  // parallax easing loop
  useRafLoop(() => {
    const board = boardRef.current;
    if (!board) return;
    if (!interactive || reduced || touch) {
      board.style.transform = 'rotateX(56deg) rotateZ(-4deg)';
      return;
    }
    eased.current.x += (pointer.current.x - eased.current.x) * 0.06;
    eased.current.y += (pointer.current.y - eased.current.y) * 0.06;
    const rotX = 56 - eased.current.y * 6;
    const rotZ = -4 + eased.current.x * 7;
    board.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg)`;
  }, interactive && !reduced && !touch);

  const soilLayers = 9;
  const layerColors = isDark
    ? ['#123227', '#0f2b21', '#0d251c', '#0b2019', '#231a10', '#2c2013', '#241a10', '#1c140b', '#150f08']
    : ['#8FA46E', '#7c8f5e', '#9a7f4e', '#a9834a', '#b08247', '#a2703c', '#8f6033', '#7a5029', '#664021'];

  return (
    <div
      ref={stageRef}
      className={`relative select-none ${className}`}
      style={{ height, perspective: '1400px' }}
    >
      {/* ---------------- sky / weather overlay (screen space) ------------- */}
      {showWeather && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* sun / moon */}
          <div
            className="absolute right-[10%] top-[8%] h-16 w-16 rounded-full animate-breathe"
            style={{
              background: isDark
                ? 'radial-gradient(circle at 38% 34%, #e9f3ec, #9db8ab 62%, transparent 72%)'
                : 'radial-gradient(circle at 40% 36%, #fff2c4, #f3c352 60%, transparent 74%)',
              boxShadow: isDark ? '0 0 40px rgba(180,220,200,0.4)' : '0 0 60px rgba(240,190,70,0.5)',
            }}
          />
          {/* stars (dark) */}
          {isDark &&
            [
              ['18%', '14%'],
              ['32%', '22%'],
              ['70%', '18%'],
              ['52%', '10%'],
              ['84%', '30%'],
            ].map(([l, t], i) => (
              <span
                key={i}
                className="absolute h-[3px] w-[3px] rounded-full bg-[var(--grain-bright)] animate-twinkle"
                style={{ left: l, top: t, animationDelay: `${i * 0.5}s` }}
              />
            ))}
          {/* clouds */}
          {!isDark &&
            [
              { l: '12%', t: '16%', s: 1 },
              { l: '58%', t: '10%', s: 0.7 },
            ].map((c, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-white/70 blur-md animate-drift"
                style={{
                  left: c.l,
                  top: c.t,
                  width: 120 * c.s,
                  height: 34 * c.s,
                  animationDelay: `${i * -5}s`,
                }}
              />
            ))}
          {/* rain */}
          {showRain &&
            Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className="rain-drop absolute w-[1.5px] rounded-full"
                style={{
                  left: `${10 + (i * 5.2) % 80}%`,
                  top: `${18 + (i % 4) * 6}%`,
                  height: 14,
                  background: 'linear-gradient(var(--twin-water), transparent)',
                  animationDelay: `${(i % 6) * 0.18}s`,
                  opacity: 0.6,
                }}
              />
            ))}
        </div>
      )}

      {/* ---------------- the tilted land board ---------------------------- */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
        <div
          ref={boardRef}
          className="relative preserve-3d"
          style={{
            width: '82%',
            height: '58%',
            transform: 'rotateX(56deg) rotateZ(-4deg)',
            transformStyle: 'preserve-3d',
            transition: reduced ? undefined : 'transform 0.2s linear',
          }}
        >
          {/* soil strata (extruded earth block edge) */}
          {Array.from({ length: soilLayers }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-[10px]"
              style={{
                transform: `translateZ(${-(i + 1) * 4}px)`,
                background: layerColors[i] || layerColors[layerColors.length - 1],
                boxShadow: i === soilLayers - 1 ? '0 30px 50px rgba(0,0,0,0.3)' : undefined,
              }}
            />
          ))}

          {/* top surface: crop strips */}
          <div
            className="absolute inset-0 flex overflow-hidden rounded-[10px]"
            style={{
              transformStyle: 'preserve-3d',
              border: '1px solid var(--twin-edge)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.12)',
            }}
          >
            {strips.map((s, idx) => {
              const active = selectedCrop === s.name;
              return (
                <button
                  key={s.name + idx}
                  type="button"
                  onClick={() => onSelectCrop?.(active ? null : s.name)}
                  aria-label={`${s.name}${s.acres ? `, ${s.acres.toFixed(1)} acres` : ''}${
                    s.roi ? `, ${Math.round(s.roi)} percent return` : ''
                  }`}
                  aria-pressed={active}
                  className="group relative h-full cursor-pointer outline-none transition-all duration-500"
                  style={{
                    flex: `${s.share} 1 0`,
                    transformStyle: 'preserve-3d',
                    transform: active ? 'translateZ(22px)' : 'translateZ(0px)',
                    transitionTimingFunction: 'var(--ease-spring)',
                  }}
                >
                  {/* field top */}
                  <div
                    className="absolute inset-0 transition-all duration-500"
                    style={{
                      background: `linear-gradient(150deg, ${s.top}, ${s.side})`,
                      filter: active ? 'brightness(1.14) saturate(1.1)' : 'brightness(1)',
                      borderLeft: idx === 0 ? undefined : '2px solid rgba(60,44,20,0.28)',
                    }}
                  >
                    {/* planted rows texture */}
                    <div
                      className="absolute inset-0 opacity-45"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, rgba(0,0,0,0.14) 0 2px, transparent 2px 9px)',
                      }}
                    />
                    {/* subtle sheen */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent" />
                    {/* active ring */}
                    {active && (
                      <div className="absolute inset-0 ring-2 ring-[var(--grain-bright)]" style={{ boxShadow: '0 0 24px var(--glow-grain)' }} />
                    )}
                  </div>

                  {/* swaying crop blades */}
                  {!reduced &&
                    Array.from({ length: bladesPer }).map((_, b) => (
                      <span
                        key={b}
                        className={b % 2 ? 'animate-sway-b' : 'animate-sway-a'}
                        style={{
                          position: 'absolute',
                          bottom: `${12 + (b % 3) * 22}%`,
                          left: `${12 + b * (76 / bladesPer)}%`,
                          width: 3,
                          height: 16 + (b % 2) * 6,
                          borderRadius: '3px 3px 0 0',
                          background: `linear-gradient(${s.side}, ${s.top})`,
                          transformOrigin: 'bottom center',
                          animationDelay: `${b * 0.4}s`,
                          transform: 'translateZ(6px)',
                        }}
                      />
                    ))}

                  {/* billboarded data tag (on select) */}
                  {active && (
                    <div
                      className="pointer-events-none absolute left-1/2 top-1/2"
                      style={{
                        transform:
                          'translate(-50%,-50%) translateZ(66px) rotateX(-56deg) rotateZ(4deg)',
                      }}
                    >
                      <div className="panel-glass flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-left shadow-lg">
                        <span className="text-lg leading-none">{s.emoji}</span>
                        <span>
                          <span className="block font-display text-[13px] font-bold leading-none text-[var(--ink)]">
                            {s.name}
                          </span>
                          <span className="font-data text-[10px] text-[var(--ink-faint)]">
                            {s.acres ? `${s.acres.toFixed(1)} ac` : 'field'}
                            {s.roi ? ` · ${Math.round(s.roi)}% ROI` : ''}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}

            {/* irrigation channel along the front edge */}
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 overflow-hidden"
              style={{ height: '7%', background: 'var(--twin-water)', transform: 'translateZ(1px)' }}
            >
              {!reduced && <div className="shine-sweep absolute inset-0 opacity-70" />}
            </div>

            {/* AI scan sweep */}
            {scanning && !reduced && (
              <div
                className="twin-scan pointer-events-none absolute top-0 h-full w-[10%]"
                style={{
                  transform: 'translateZ(3px)',
                  background:
                    'linear-gradient(90deg, transparent, var(--field-bright), transparent)',
                  opacity: 0.55,
                  mixBlendMode: isDark ? 'screen' : 'multiply',
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ground contact shadow */}
      <div
        className="pointer-events-none absolute left-1/2 top-[74%] h-10 w-[62%] -translate-x-1/2 rounded-[50%] blur-2xl"
        style={{ background: 'rgba(0,0,0,0.22)' }}
      />
    </div>
  );
}
