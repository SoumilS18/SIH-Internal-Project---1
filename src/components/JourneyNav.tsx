import React from 'react';
import { MapPin, Sprout, Layers, Radar, LogOut, Check } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';

/** The four stages that exist after sign-in. `0` means "signed out / signing in". */
export type JourneyStage = 1 | 2 | 3 | 4;

interface JourneyNavProps {
  stage: 0 | JourneyStage;
  userName?: string;
  /** Stages the farmer may jump to right now. Earlier stages are usually reachable. */
  reachable?: JourneyStage[];
  onNavigate?: (stage: JourneyStage) => void;
  onLogout?: () => void;
  /** Screen-specific actions, placed just before the utilities cluster. */
  actions?: React.ReactNode;
  /** Green while planning, gold once a plan exists. */
  accent?: 'field' | 'grain';
}

const STAGES: {
  n: JourneyStage;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  en: string;
  hi: string;
}[] = [
  { n: 1, icon: MapPin, en: 'Location', hi: 'स्थान' },
  { n: 2, icon: Sprout, en: 'Field', hi: 'खेत' },
  { n: 3, icon: Layers, en: 'Plan', hi: 'योजना' },
  { n: 4, icon: Radar, en: 'Sentinel', hi: 'सेंटीनेल' },
];

/* -------------------------------------------------------------------------- */
/* THE GROWTH LINE — the signature nav element.                               */
/* A stem grows through the four stages: the segment behind you is living     */
/* green, the segment ahead is dormant sage. It encodes real progress, so it  */
/* earns its place (this journey genuinely is a sequence). The stem stays     */
/* green throughout — growth — and only the marker you are standing on turns  */
/* gold once a plan exists, so sunlight remains a single precious accent.     */
/* -------------------------------------------------------------------------- */
function Segment({ grown }: { grown: boolean }) {
  return (
    <span className="relative h-px w-4 shrink-0 overflow-hidden sm:w-5" aria-hidden>
      <span className="absolute inset-0 bg-[var(--sage)] opacity-50" />
      <span
        className="absolute inset-y-0 left-0 origin-left transition-transform duration-700"
        style={{
          right: 0,
          transform: `scaleX(${grown ? 1 : 0})`,
          transitionTimingFunction: 'var(--ease-out)',
          background: grown
            ? 'linear-gradient(90deg, var(--field-bright), var(--field))'
            : 'transparent',
        }}
      />
    </span>
  );
}

function StageButton({
  stage,
  state,
  accent,
  compact,
  onClick,
}: {
  stage: (typeof STAGES)[number];
  state: 'done' | 'current' | 'ahead';
  accent: 'field' | 'grain';
  compact: boolean;
  onClick?: () => void;
}) {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const label = isHi ? stage.hi : stage.en;
  const Icon = stage.icon;
  const clickable = Boolean(onClick);

  const base =
    'group relative inline-flex items-center gap-2 rounded-full transition-all duration-300 focus-visible:outline-none';
  const size = compact ? 'h-8 px-2.5' : 'h-9 px-3';

  if (state === 'current') {
    return (
      <span
        aria-current="step"
        className={`${base} ${size} font-medium text-white`}
        style={{
          background: `linear-gradient(135deg, var(--${accent}-bright), var(--${accent}))`,
          boxShadow: `0 6px 20px var(--glow-${accent})`,
          paddingRight: compact ? '0.85rem' : '1rem',
        }}
      >
        <Icon size={compact ? 13 : 14} />
        <span className="text-[11px] uppercase tracking-[0.13em]">{label}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      aria-disabled={!clickable}
      title={label}
      aria-label={
        clickable
          ? state === 'done'
            ? isHi
              ? `${label} पर वापस जाएं`
              : `Back to ${label}`
            : isHi
            ? `${label} पर जाएं`
            : `Proceed to ${label}`
          : `${label}${isHi ? ' — अभी उपलब्ध नहीं' : ' — not yet available'}`
      }
      className={`${base} ${compact ? 'h-8 w-8' : 'h-9 w-9'} justify-center ${
        clickable
          ? 'text-[var(--field)] hover:bg-[var(--field-tint)] cursor-pointer hover:scale-105 transition-all'
          : 'text-[var(--ink-ghost)] cursor-default'
      }`}
    >
      {state === 'done' ? (
        <>
          <Icon size={compact ? 14 : 15} className="transition-opacity group-hover:opacity-0" />
          <Check
            size={compact ? 14 : 15}
            className="absolute opacity-0 transition-opacity group-hover:opacity-100"
          />
        </>
      ) : (
        <Icon size={compact ? 14 : 15} />
      )}
    </button>
  );
}

function StageTrack({
  stage,
  reachable,
  onNavigate,
  accent,
  compact = false,
}: {
  stage: JourneyStage;
  reachable: JourneyStage[];
  onNavigate?: (s: JourneyStage) => void;
  accent: 'field' | 'grain';
  compact?: boolean;
}) {
  const { language } = useLanguage();
  return (
    <nav aria-label={language === 'hi' ? 'यात्रा के चरण' : 'Journey stages'}>
      <ol
        className={`nav-pill flex items-center ${compact ? 'gap-0.5 p-1' : 'gap-1 p-1.5'}`}
        style={{ listStyle: 'none', margin: 0 }}
      >
        {STAGES.map((s, i) => {
          const state = s.n < stage ? 'done' : s.n === stage ? 'current' : 'ahead';
          return (
            <React.Fragment key={s.n}>
              {i > 0 && <Segment grown={s.n <= stage} />}
              <li className="flex">
                <StageButton
                  stage={s}
                  state={state}
                  accent={accent}
                  compact={compact}
                  onClick={
                    reachable.includes(s.n) && onNavigate ? () => onNavigate(s.n) : undefined
                  }
                />
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

/* A hue-neutral frost that fades out, so page content passes cleanly beneath
   the floating chrome without a visible band of a different tone. */
const frost = (dir: 'to bottom' | 'to top'): React.CSSProperties => {
  const mask = `linear-gradient(${dir}, #000 0%, #000 42%, transparent 100%)`;
  return {
    backdropFilter: 'blur(7px)',
    WebkitBackdropFilter: 'blur(7px)',
    maskImage: mask,
    WebkitMaskImage: mask,
  };
};

/* -------------------------------------------------------------------------- */
/* JOURNEY NAV — one floating chrome layer shared by every screen.            */
/* Desktop: brand left, journey pill centred, utilities right.                */
/* Mobile: brand + utilities stay on top, the journey pill moves to the       */
/* bottom where a thumb can actually reach it.                                */
/* -------------------------------------------------------------------------- */
export function JourneyNav({
  stage,
  userName,
  reachable = [],
  onNavigate,
  onLogout,
  actions,
  accent = 'field',
}: JourneyNavProps) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[5.5rem]"
          style={frost('to bottom')}
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-[1560px] items-center justify-between gap-3 px-4 pt-4 sm:px-6">
          {/* ---------------- brand: floating, no container ---------------- */}
          <div className="pointer-events-auto flex items-center gap-2.5 shrink-0">
            <span
              className="leaf-radius grid h-9 w-9 place-items-center text-white"
              style={{
                background: 'linear-gradient(140deg, var(--field-bright), var(--field-deep))',
                boxShadow: '0 6px 18px var(--glow-field)',
              }}
              aria-hidden
            >
              <Sprout size={17} />
            </span>
            <span className="hidden font-display text-[15px] font-medium tracking-tight text-[var(--ink)] sm:inline">
              AgriOptima<span className="text-[var(--field)]"> AI</span>
            </span>
          </div>

          {/* ---------------- journey pill (desktop, centered without collision) -------------- */}
          {stage > 0 && (
            <div className="pointer-events-auto hidden md:flex justify-center flex-1 min-w-0 px-2">
              <StageTrack
                stage={stage as JourneyStage}
                reachable={reachable}
                onNavigate={onNavigate}
                accent={accent}
              />
            </div>
          )}

          {/* ---------------- utilities: screen actions, then one group ---- */}
          <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
            {actions && (
              <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
                {actions}
              </div>
            )}

            <div className="nav-pill pointer-events-auto flex items-center gap-0.5 p-1">
              <LanguageSelector variant="bare" />
              {userName && (
                <span className="hidden items-center gap-2 border-l border-[var(--line-soft)] pl-2 pr-1.5 sm:inline-flex">
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold text-[var(--field-deep)]"
                    style={{ background: 'var(--field-tint)' }}
                    aria-hidden
                  >
                    {userName.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[8rem] truncate text-xs font-medium text-[var(--ink-soft)]">
                    {userName}
                  </span>
                </span>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="grid h-9 w-9 place-items-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--risk-tint)] hover:text-[var(--risk)]"
                  title={isHi ? 'लॉगआउट' : 'Log out'}
                  aria-label={isHi ? 'लॉगआउट' : 'Log out'}
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- journey pill (mobile, bottom) ------------------- */}
      {stage > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 md:hidden">
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[5.5rem]"
            style={frost('to top')}
            aria-hidden
          />
          <div className="pointer-events-auto relative">
            <StageTrack
              stage={stage as JourneyStage}
              reachable={reachable}
              onNavigate={onNavigate}
              accent={accent}
              compact
            />
          </div>
        </div>
      )}
    </>
  );
}
