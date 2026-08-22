import { useState, useMemo } from 'react';
import { STATE_PATHS, STATE_NAMES, STATE_TO_LANG_MAP } from '@/lib/indiaMap';
import { type LanguageCode } from '@/lib/languages';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { useLanguage } from '@/i18n/LanguageContext';
import { getStateDisplayName } from '@/i18n/geoNames';

interface IndiaMapProps {
  hovered?: LanguageCode | null;
  selected?: LanguageCode | null;
  onHover?: (code: LanguageCode | null, stateName?: string) => void;
  onSelect: (code: LanguageCode, stateName?: string) => void;
  transitioning: boolean;
}

const PARTICLES = Array.from({ length: 18 }, (_, id) => ({
  id,
  cx: 90 + Math.random() * 420,
  cy: 70 + Math.random() * 570,
  r: 0.7 + Math.random() * 1.2,
}));

function parsePathStart(pathStr: string): { x: number; y: number } | null {
  const m = pathStr.match(/m\s+([-\d.]+),([-\d.]+)/i);
  if (!m) return null;
  return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
}

export function IndiaMap({
  onHover,
  onSelect,
  transitioning,
}: IndiaMapProps) {
  const reduced = usePrefersReducedMotion();
  const { language } = useLanguage();
  const particles = useMemo(() => PARTICLES, []);
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);

  // Smooth zoom transition directly targeting the clicked individual state
  const zoomTransform = useMemo(() => {
    if (!transitioning || !selectedStateId || !STATE_PATHS[selectedStateId]) return '';
    const c = parsePathStart(STATE_PATHS[selectedStateId]);
    if (!c) return '';
    const dx = 306 - c.x;
    const dy = 348 - c.y;
    return `translate(${dx * 0.42}px, ${dy * 0.42}px) scale(1.85)`;
  }, [transitioning, selectedStateId]);

  const rawHoveredStateName = hoveredStateId ? STATE_NAMES[hoveredStateId] || null : null;
  const hoveredStateName = rawHoveredStateName ? getStateDisplayName(rawHoveredStateName, language) : null;

  return (
    <div
      className={`relative h-full w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        transitioning ? 'scale-[1.15]' : ''
      }`}
      style={zoomTransform ? { transform: zoomTransform } : undefined}
    >
      <svg
        viewBox="0 0 612 696"
        className="h-full w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="Interactive India State Selection Map"
      >
        <defs>
          <filter id="stateGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="mapShadow" x="-30%" y="-20%" width="160%" height="160%">
            <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#01130e" floodOpacity="0.8" />
          </filter>
          <linearGradient id="mapSurface" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#0b3a2a" />
            <stop offset="0.5" stopColor="#021b13" />
            <stop offset="1" stopColor="#010d0a" />
          </linearGradient>
          <pattern id="mapTexture" width="18" height="18" patternUnits="userSpaceOnUse">
            <path
              d="M0 18L18 0M-4 4L4-4M14 22L22 14"
              stroke="#d9aa16"
              strokeOpacity="0.045"
              strokeWidth="1"
            />
          </pattern>
          <clipPath id="indiaClip">
            {Object.values(STATE_PATHS).map((path, index) => (
              <path key={index} d={path} />
            ))}
          </clipPath>
        </defs>

        <g filter="url(#mapShadow)">
          {/* Each state rendered and selected strictly individually / ungrouped */}
          {Object.entries(STATE_PATHS).map(([id, path]) => {
            const rawStateName = STATE_NAMES[id] || id;
            const localizedStateName = getStateDisplayName(rawStateName, language);
            const stateLangCode = STATE_TO_LANG_MAP[id] || 'en';
            const isStateHovered = hoveredStateId === id;
            const isStateSelected = selectedStateId === id;
            const isActive = isStateHovered || isStateSelected;
            const isSelected = isStateSelected;
            const isGoa = id === 'ga';

            return (
              <path
                key={id}
                d={path}
                fill={isSelected ? '#b98b10' : isActive ? '#6f631d' : 'url(#mapSurface)'}
                stroke={isActive ? '#ffe36a' : '#b89425'}
                strokeWidth={isActive ? (isGoa ? 2.8 : 2.0) : isGoa ? 1.4 : 0.9}
                strokeLinejoin="round"
                opacity={transitioning && selectedStateId && !isSelected ? 0.55 : 1}
                tabIndex={0}
                role="button"
                aria-label={localizedStateName}
                aria-pressed={isSelected}
                style={{
                  cursor: 'pointer',
                  transition:
                    'fill 260ms ease, stroke 260ms ease, stroke-width 260ms ease, opacity 500ms ease',
                  filter: isActive ? 'url(#stateGlow)' : undefined,
                }}
                onMouseEnter={() => {
                  setHoveredStateId(id);
                  onHover?.(stateLangCode, rawStateName);
                }}
                onMouseLeave={() => {
                  setHoveredStateId(null);
                  onHover?.(null);
                }}
                onFocus={() => {
                  setHoveredStateId(id);
                  onHover?.(stateLangCode, rawStateName);
                }}
                onBlur={() => {
                  setHoveredStateId(null);
                  onHover?.(null);
                }}
                onClick={() => {
                  if (transitioning) return;
                  setSelectedStateId(id);
                  onSelect(stateLangCode, rawStateName);
                }}
              >
                <title>{localizedStateName}</title>
              </path>
            );
          })}

          {/* Internal texture clipped to India */}
          <rect
            x="0"
            y="0"
            width="612"
            height="696"
            fill="url(#mapTexture)"
            clipPath="url(#indiaClip)"
            pointerEvents="none"
          />

          {/* Gold particles inside India */}
          <g clipPath="url(#indiaClip)" opacity="0.45" pointerEvents="none">
            {particles.map((particle) => (
              <circle
                key={particle.id}
                cx={particle.cx}
                cy={particle.cy}
                r={particle.r}
                fill="#ffe36a"
                style={
                  reduced
                    ? undefined
                    : {
                        animation: `twinkle ${3 + (particle.id % 4)}s ease-in-out ${
                          particle.id / 5
                        }s infinite`,
                      }
                }
              />
            ))}
          </g>
        </g>
      </svg>

      {/* Floating tooltip showing ONLY the Localized State Name on hover */}
      {hoveredStateName && (
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full border border-gold-300/40 bg-forest-950/95 px-5 py-1.5 text-center shadow-[0_0_24px_rgba(255,210,26,0.3)] backdrop-blur-md">
          <span className="font-serif text-sm font-semibold tracking-wide text-gold-100">
            {hoveredStateName}
          </span>
        </div>
      )}
    </div>
  );
}
