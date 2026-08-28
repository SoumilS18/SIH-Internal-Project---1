import { useState, useMemo } from 'react';
import { STATE_PATHS, STATE_NAMES, STATE_TO_LANG_MAP } from '@/lib/indiaMap';
import { useLanguage } from '@/i18n/LanguageContext';
import { getStateDisplayName } from '@/i18n/geoNames';

interface IndiaMapProps {
  hovered?: string | null;
  selectedStateName?: string | null;
  onHover?: (code: string | null, stateName?: string) => void;
  onSelect: (code: string, stateName?: string) => void;
  transitioning?: boolean;
}

function parsePathStart(pathStr: string): { x: number; y: number } | null {
  const m = pathStr.match(/m\s+([-\d.]+),([-\d.]+)/i);
  if (!m) return null;
  return { x: parseFloat(m[1]), y: parseFloat(m[2]) };
}

export function IndiaMap({
  selectedStateName,
  onHover,
  onSelect,
  transitioning = false,
}: IndiaMapProps) {
  const { language } = useLanguage();
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);

  const effectiveSelectedStateId = useMemo(() => {
    if (!selectedStateName) return selectedStateId;
    const entry = Object.entries(STATE_NAMES).find(
      ([_id, name]) => name.toLowerCase() === selectedStateName.toLowerCase()
    );
    return entry ? entry[0] : selectedStateId;
  }, [selectedStateName, selectedStateId]);

  // Smooth zoom transition directly targeting the clicked individual state
  const zoomTransform = useMemo(() => {
    const targetId = effectiveSelectedStateId;
    if (!transitioning || !targetId || !STATE_PATHS[targetId]) return '';
    const c = parsePathStart(STATE_PATHS[targetId]);
    if (!c) return '';
    const dx = 306 - c.x;
    const dy = 348 - c.y;
    return `translate(${dx * 0.42}px, ${dy * 0.42}px) scale(1.85)`;
  }, [transitioning, effectiveSelectedStateId]);

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
        className="h-full w-full overflow-visible select-none"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="Interactive India State Selection Map"
      >
        <defs>
          <filter id="stateGlowWarm" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          <filter id="mapShadowWarm" x="-15%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="5" stdDeviation="9" floodColor="#343A2C" floodOpacity="0.12" />
          </filter>

          <linearGradient id="mapSurfaceWarm" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F3F1E8" />
          </linearGradient>
        </defs>

        {/* =================================================================== */}
        {/* BACKGROUND CARTOGRAPHIC ELEMENTS (Deeper Ocean Blue Atmosphere) */}
        {/* =================================================================== */}
        <g className="pointer-events-none" opacity="0.95">
          {/* Subtle Grid Crosses (+) */}
          <g stroke="var(--sage-deep)" strokeWidth="1" opacity="0.4">
            {/* Top-Left Cross */}
            <path d="M 60 140 L 70 140 M 65 135 L 65 145" />
            {/* Arabian Sea Crosses */}
            <path d="M 95 380 L 105 380 M 100 375 L 100 385" />
            <path d="M 80 520 L 90 520 M 85 515 L 85 525" />
            {/* Bay of Bengal Crosses */}
            <path d="M 480 390 L 490 390 M 485 385 L 485 395" />
            <path d="M 520 500 L 530 500 M 525 495 L 525 505" />
            {/* South Cross */}
            <path d="M 300 640 L 310 640 M 305 635 L 305 645" />
          </g>

          {/* Coordinate Micro Labels */}
          <text x="68" y="132" fill="var(--ink-ghost)" fontSize="7.5" className="font-data" opacity="0.9">28°N 72°E</text>
          <text x="98" y="372" fill="var(--ink-ghost)" fontSize="7.5" className="font-data" opacity="0.9">18°N 68°E</text>
          <text x="488" y="382" fill="var(--ink-ghost)" fontSize="7.5" className="font-data" opacity="0.9">17°N 88°E</text>

          {/* Subtle Ocean Wave Lines in Arabian Sea */}
          <g fill="none" stroke="var(--sky)" strokeWidth="1" opacity="0.38" strokeDasharray="3 4">
            <path d="M 45 420 Q 75 415, 105 422 T 140 418" />
            <path d="M 40 450 Q 70 445, 110 453" />
            <path d="M 50 480 Q 80 475, 120 482" />
          </g>

          {/* Subtle Ocean Wave Lines in Bay of Bengal */}
          <g fill="none" stroke="var(--sky)" strokeWidth="1" opacity="0.38" strokeDasharray="3 4">
            <path d="M 460 420 Q 495 415, 540 422" />
            <path d="M 470 455 Q 510 448, 555 456" />
            <path d="M 460 490 Q 500 482, 545 492" />
          </g>

          {/* Subtle Ocean Labels */}
          <text
            x="65"
            y="460"
            fill="var(--sky)"
            fontSize="8.5"
            fontWeight="600"
            letterSpacing="0.28em"
            opacity="0.7"
          >
            ARABIAN SEA
          </text>

          <text
            x="465"
            y="460"
            fill="var(--sky)"
            fontSize="8.5"
            fontWeight="600"
            letterSpacing="0.28em"
            opacity="0.7"
          >
            BAY OF BENGAL
          </text>

          <text
            x="240"
            y="655"
            fill="var(--sky)"
            fontSize="8"
            fontWeight="600"
            letterSpacing="0.28em"
            opacity="0.65"
          >
            INDIAN OCEAN
          </text>

          {/* Minimalist Compass Rose (North Arrow) in Top-Right */}
          <g transform="translate(530, 60)" opacity="0.75">
            <circle cx="0" cy="0" r="14" fill="none" stroke="var(--sage-deep)" strokeWidth="0.9" strokeDasharray="2 2" />
            {/* North pointer arrow */}
            <polygon points="0,-12 3,2 0,0 -3,2" fill="var(--grain)" />
            <polygon points="0,12 3,0 0,0 -3,0" fill="var(--sage)" />
            <text x="0" y="-15" textAnchor="middle" fill="var(--grain-deep)" fontSize="8" fontWeight="600">N</text>
          </g>
        </g>

        {/* =================================================================== */}
        {/* INDIA STATES PATHS */}
        {/* =================================================================== */}
        <g filter="url(#mapShadowWarm)">
          {Object.entries(STATE_PATHS).map(([id, path]) => {
            const rawStateName = STATE_NAMES[id] || id;
            const localizedStateName = getStateDisplayName(rawStateName, language);
            const stateLangCode = STATE_TO_LANG_MAP[id] || 'en';
            const isStateHovered = hoveredStateId === id;
            const isStateSelected = effectiveSelectedStateId === id;
            const isGoa = id === 'ga';

            // One growing world: the chosen state is living field green, a hovered
            // state is the palest wash of the same green, everything else is paper.
            const fill = isStateSelected
              ? 'var(--field)'
              : isStateHovered
              ? 'var(--field-tint)'
              : 'url(#mapSurfaceWarm)';

            const stroke = isStateSelected
              ? 'var(--field-deep)'
              : isStateHovered
              ? 'var(--field)'
              : 'var(--line-strong)';

            const strokeWidth = isStateSelected
              ? (isGoa ? 2.6 : 1.8)
              : isStateHovered
              ? (isGoa ? 2.0 : 1.4)
              : (isGoa ? 1.2 : 0.85);

            return (
              <path
                key={id}
                d={path}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                opacity={transitioning && effectiveSelectedStateId && !isStateSelected ? 0.55 : 1}
                tabIndex={0}
                role="button"
                aria-label={localizedStateName}
                aria-pressed={isStateSelected}
                className="outline-none focus:outline-none focus-visible:outline-none"
                style={{
                  cursor: 'pointer',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  transition:
                    'fill 200ms ease, stroke 200ms ease, stroke-width 200ms ease, opacity 350ms ease',
                  filter: isStateSelected ? 'url(#stateGlowWarm)' : undefined,
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
        </g>
      </svg>

      {/* Floating tooltip showing ONLY the Localized State Name on hover */}
      {hoveredStateName && (
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full bg-[var(--surface-elevated)] px-3.5 py-1 text-center shadow-[var(--shadow-md)] backdrop-blur-md">
          <span className="text-xs font-semibold tracking-wide text-[var(--ink)]">
            {hoveredStateName}
          </span>
        </div>
      )}
    </div>
  );
}
