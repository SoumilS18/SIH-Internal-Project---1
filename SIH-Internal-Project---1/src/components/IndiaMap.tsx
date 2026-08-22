import { useMemo } from 'react';
import { STATE_PATHS, STATE_NAMES, LANG_STATES, HINDI_BELT } from '@/lib/indiaMap';
import { LANGUAGES, type LanguageCode } from '@/lib/languages';
import { usePrefersReducedMotion } from '@/lib/hooks';

interface IndiaMapProps {
  hovered: LanguageCode | null;
  selected: LanguageCode | null;
  onHover: (code: LanguageCode | null) => void;
  onSelect: (code: LanguageCode) => void;
  transitioning: boolean;
}

const STATE_TO_LANG: Record<string, LanguageCode> = {};
LANG_STATES.forEach((state) => { STATE_TO_LANG[state.stateId] = state.langCode; });
HINDI_BELT.forEach((stateId) => { STATE_TO_LANG[stateId] = 'hi'; });

const LANG_INFO: Record<string, { english: string; native: string }> = {};
LANGUAGES.forEach((language) => { LANG_INFO[language.code] = { english: language.english, native: language.label }; });

const NEPAL_CENTROID = { x: 345, y: 202 };
const OM_CENTROID = { x: 360, y: 110 };
const PARTICLES = Array.from({ length: 18 }, (_, id) => ({ id, cx: 90 + Math.random() * 420, cy: 70 + Math.random() * 570, r: 0.7 + Math.random() * 1.2 }));

function parsePathStart(pathStr: string): { x: number; y: number } | null {
  const m = pathStr.match(/m\s+([-\d.]+),([-\d.]+)/i);
  if (!m) return null;
  return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
}

function getCentroid(code: LanguageCode): { x: number; y: number } | null {
  if (code === 'sa') return OM_CENTROID;
  if (code === 'ne') return NEPAL_CENTROID;
  for (const [stateId, lang] of Object.entries(STATE_TO_LANG)) {
    if (lang === code) {
      return parsePathStart(STATE_PATHS[stateId]);
    }
  }
  return null;
}

export function IndiaMap({ hovered, selected, onHover, onSelect, transitioning }: IndiaMapProps) {
  const reduced = usePrefersReducedMotion();
  const particles = useMemo(() => PARTICLES, []);
  const activeInfo = hovered ? LANG_INFO[hovered] : null;

  const zoomTransform = useMemo(() => {
    if (!transitioning || !selected) return '';
    const c = getCentroid(selected);
    if (!c) return '';
    const dx = 306 - c.x;
    const dy = 348 - c.y;
    return `translate(${dx * 0.42}px, ${dy * 0.42}px) scale(1.85)`;
  }, [transitioning, selected]);

  const omActive = hovered === 'sa' || selected === 'sa';
  const omSelected = selected === 'sa';

  return (
    <div className={`relative h-full w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${transitioning ? 'scale-[1.15]' : ''}`} style={zoomTransform ? { transform: zoomTransform } : undefined}>
      <svg viewBox="0 0 612 696" className="h-full w-full overflow-visible" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Interactive India language map">
        <defs>
          <filter id="stateGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="mapShadow" x="-30%" y="-20%" width="160%" height="160%"><feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#01130e" floodOpacity="0.8" /></filter>
          <linearGradient id="mapSurface" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#0b3a2a" /><stop offset="0.5" stopColor="#021b13" /><stop offset="1" stopColor="#010d0a" /></linearGradient>
          <pattern id="mapTexture" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 18L18 0M-4 4L4-4M14 22L22 14" stroke="#d9aa16" strokeOpacity="0.045" strokeWidth="1" /></pattern>
          <clipPath id="indiaClip">{Object.values(STATE_PATHS).map((path, index) => <path key={index} d={path} />)}</clipPath>
        </defs>

        <g filter="url(#mapShadow)">
          {Object.entries(STATE_PATHS).map(([id, path]) => {
            const language = STATE_TO_LANG[id];
            const info = language ? LANG_INFO[language] : null;
            const isActive = language === hovered || language === selected;
            const isSelected = language === selected;
            const isGoa = id === 'ga';
            return (
              <path
                key={id}
                d={path}
                fill={isSelected ? '#b98b10' : isActive ? '#6f631d' : 'url(#mapSurface)'}
                stroke={isActive ? '#ffe36a' : '#b89425'}
                strokeWidth={isActive ? (isGoa ? 2.5 : 1.8) : isGoa ? 1.2 : 0.85}
                strokeLinejoin="round"
                opacity={transitioning && selected && !isActive ? 0.55 : 1}
                tabIndex={language ? 0 : -1}
                role={language ? 'button' : undefined}
                aria-label={info ? `${STATE_NAMES[id]} — ${info.english}` : undefined}
                aria-pressed={isSelected}
                style={{ cursor: language ? 'pointer' : 'default', transition: 'fill 260ms ease, stroke 260ms ease, stroke-width 260ms ease, opacity 500ms ease', filter: isActive ? 'url(#stateGlow)' : undefined }}
                onMouseEnter={() => language && onHover(language)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => language && onHover(language)}
                onBlur={() => onHover(null)}
                onClick={() => language && !transitioning && onSelect(language)}
              >
                {info && <title>{STATE_NAMES[id]} — {info.english} ({info.native})</title>}
              </path>
            );
          })}
          <text
            x="345"
            y="210"
            textAnchor="middle"
            fill="url(#mapSurface)"
            stroke={hovered === 'ne' || selected === 'ne' ? '#ffe36a' : '#b89425'}
            strokeWidth={hovered === 'ne' || selected === 'ne' ? 1.4 : 0.85}
            paintOrder="stroke"
            strokeLinejoin="round"
            fontFamily="Georgia, serif"
            fontSize="21"
            fontWeight="600"
            letterSpacing="2"
            tabIndex={0}
            role="button"
            aria-label="Nepal — Nepali"
            aria-pressed={selected === 'ne'}
            style={{ cursor: 'pointer', transition: 'stroke 260ms ease, stroke-width 260ms ease, opacity 500ms ease', filter: hovered === 'ne' || selected === 'ne' ? 'url(#stateGlow)' : undefined }}
            opacity={transitioning && selected && selected !== 'ne' ? 0.55 : 1}
            onMouseEnter={() => onHover('ne')}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover('ne')}
            onBlur={() => onHover(null)}
            onClick={() => !transitioning && onSelect('ne')}
          >
            NEPAL
            <title>Nepal — Nepali</title>
          </text>
          <text
            x="390"
            y="112"
            textAnchor="middle"
            fill="url(#mapSurface)"
            stroke={omSelected ? '#ffe36a' : omActive ? '#e4bf38' : '#b89425'}
            strokeWidth={omActive || omSelected ? 1.7 : 1.1}
            paintOrder="stroke"
            strokeLinejoin="round"
            fontFamily="Georgia, serif"
            fontSize="58"
            fontWeight="600"
            tabIndex={0}
            role="button"
            aria-label="Sanskrit"
            aria-pressed={omSelected}
            style={{ cursor: 'pointer', transition: 'stroke 260ms ease, stroke-width 260ms ease', filter: omActive ? 'url(#stateGlow)' : undefined }}
            onMouseEnter={() => onHover('sa')}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover('sa')}
            onBlur={() => onHover(null)}
            onClick={() => !transitioning && onSelect('sa')}
          >
            ॐ
            <title>Sanskrit</title>
          </text>
          {/* Internal texture clipped to India */}
          <rect x="0" y="0" width="612" height="696" fill="url(#mapTexture)" clipPath="url(#indiaClip)" pointerEvents="none" />
          {/* Gold particles inside India */}
          <g clipPath="url(#indiaClip)" opacity="0.45" pointerEvents="none">{particles.map((particle) => <circle key={particle.id} cx={particle.cx} cy={particle.cy} r={particle.r} fill="#ffe36a" style={reduced ? undefined : { animation: `twinkle ${3 + particle.id % 4}s ease-in-out ${particle.id / 5}s infinite` }} />)}</g>
        </g>
      </svg>

      {/* Floating tooltip for hovered language */}
      {activeInfo && hovered !== 'sa' && (
        <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-lg border border-gold-300/40 bg-forest-950/90 px-3 py-1.5 text-center shadow-[0_0_24px_rgba(255,210,26,0.14)] backdrop-blur-md">
          <span className="font-serif text-sm text-cream-100">{activeInfo.english}</span>
          <span className="ml-2 font-serif text-sm text-gold-200">{activeInfo.native}</span>
        </div>
      )}
    </div>
  );
}
