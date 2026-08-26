import React, { useCallback } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/theme/ThemeContext';
import { useLanguage } from '@/i18n/LanguageContext';

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

/**
 * Premium day↔night control. The knob is a sun in Daylight and a crescent moon
 * in Nightfall; clicking launches the circular world-sweep from the knob's
 * position (handled by ThemeProvider).
 */
export function ThemeToggle({ className = '', compact = false }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      toggleTheme({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    },
    [toggleTheme]
  );

  const label = isDark
    ? isHi
      ? 'दिन के रूप में बदलें'
      : 'Switch to Daylight'
    : isHi
      ? 'रात के रूप में बदलें'
      : 'Switch to Nightfall';

  const w = compact ? 56 : 64;
  const h = compact ? 30 : 34;
  const knob = h - 8;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      className={`group relative inline-flex shrink-0 items-center overflow-hidden rounded-full border transition-colors duration-500 ${className}`}
      style={{
        width: w,
        height: h,
        borderColor: 'var(--line-strong)',
        background: isDark
          ? 'linear-gradient(180deg, #0b1f1a, #071310)'
          : 'linear-gradient(180deg, #eaf1de, #dbe8f0)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Stars (dark) */}
      <span
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{ opacity: isDark ? 1 : 0 }}
        aria-hidden="true"
      >
        {[
          { x: '22%', y: '32%', d: '0s' },
          { x: '38%', y: '64%', d: '0.6s' },
          { x: '30%', y: '48%', d: '1.1s' },
        ].map((s, i) => (
          <span
            key={i}
            className="absolute h-[2px] w-[2px] rounded-full bg-[var(--grain-bright)] animate-twinkle"
            style={{ left: s.x, top: s.y, animationDelay: s.d }}
          />
        ))}
      </span>

      {/* Sun rays (light) */}
      <span
        className="pointer-events-none absolute right-[7px] top-1/2 -translate-y-1/2 transition-opacity duration-500"
        style={{ opacity: isDark ? 0 : 0.5 }}
        aria-hidden="true"
      >
        <span
          className="block h-3 w-3 rounded-full"
          style={{ background: 'radial-gradient(circle, var(--grain-bright), transparent 70%)' }}
        />
      </span>

      {/* Knob */}
      <span
        className="absolute top-1/2 flex items-center justify-center rounded-full transition-all duration-500"
        style={{
          height: knob,
          width: knob,
          transform: `translateY(-50%) translateX(${isDark ? w - knob - 4 : 4}px)`,
          transitionTimingFunction: 'var(--ease-spring)',
          background: isDark
            ? 'radial-gradient(circle at 35% 30%, #cfe8dd, #7fae9c)'
            : 'radial-gradient(circle at 35% 30%, #ffe08a, #f0aa2e)',
          boxShadow: isDark
            ? '0 0 12px rgba(140,220,190,0.55)'
            : '0 0 12px rgba(240,170,46,0.6)',
        }}
      >
        {isDark ? (
          <Moon size={compact ? 12 : 14} className="text-[#0a1a14]" strokeWidth={2.4} />
        ) : (
          <Sun size={compact ? 12 : 14} className="text-[#6b4a06]" strokeWidth={2.4} />
        )}
      </span>
    </button>
  );
}
