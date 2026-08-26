import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  setTheme: (t: Theme) => void;
  /** Toggle with an optional origin (client px) for the day↔night sweep. */
  toggleTheme: (origin?: { x: number; y: number }) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'agrioptima_theme_v1';

function readInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* ignore */
  }
  // Default to the natural "Daylight" world (farmer-friendly, brand-consistent).
  return 'light';
}

function applyThemeAttr(theme: Theme) {
  try {
    document.documentElement.setAttribute('data-theme', theme);
  } catch {
    /* ignore */
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readInitialTheme());
  const [sweep, setSweep] = useState<{ target: Theme; x: number; y: number } | null>(null);
  const sweepRef = useRef<HTMLDivElement | null>(null);

  // Apply attribute on mount + whenever theme changes (kept in sync)
  useEffect(() => {
    applyThemeAttr(theme);
  }, [theme]);

  const commitTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyThemeAttr(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      if (t === theme) return;
      commitTheme(t);
    },
    [theme, commitTheme]
  );

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const target: Theme = theme === 'light' ? 'dark' : 'light';

      if (prefersReducedMotion() || typeof window === 'undefined') {
        commitTheme(target);
        return;
      }

      const x = origin?.x ?? window.innerWidth * 0.88;
      const y = origin?.y ?? window.innerHeight * 0.08;
      setSweep({ target, x, y });
    },
    [theme, commitTheme]
  );

  // Drive the sweep animation lifecycle
  useEffect(() => {
    if (!sweep) return;
    const el = sweepRef.current;
    if (!el) {
      commitTheme(sweep.target);
      setSweep(null);
      return;
    }
    const xPct = (sweep.x / window.innerWidth) * 100;
    const yPct = (sweep.y / window.innerHeight) * 100;
    el.style.setProperty('--sweep-x', `${xPct}%`);
    el.style.setProperty('--sweep-y', `${yPct}%`);

    // force reflow so the animation restarts reliably
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.offsetWidth;
    el.classList.add('run');

    const onEnd = () => {
      commitTheme(sweep.target);
      // let the (target-colored) overlay linger one frame over the now-matching
      // UI, then fade it out for a seamless hand-off
      requestAnimationFrame(() => {
        if (sweepRef.current) sweepRef.current.style.opacity = '0';
        window.setTimeout(() => setSweep(null), 180);
      });
    };
    el.addEventListener('animationend', onEnd, { once: true });

    // safety timeout in case animationend doesn't fire
    const fallback = window.setTimeout(onEnd, 1100);
    return () => {
      el.removeEventListener('animationend', onEnd);
      window.clearTimeout(fallback);
    };
  }, [sweep, commitTheme]);

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {sweep && (
        <div
          ref={sweepRef}
          data-theme={sweep.target}
          className="theme-sweep"
          aria-hidden="true"
          style={{
            opacity: 1,
            transition: 'opacity 0.18s ease',
            background:
              'radial-gradient(1200px 700px at 82% -8%, var(--halo), transparent 60%),' +
              'radial-gradient(1000px 800px at -6% 108%, var(--glow-field), transparent 55%),' +
              'linear-gradient(180deg, var(--paper-3) 0%, var(--paper) 42%, var(--paper-2) 100%)',
          }}
        />
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
