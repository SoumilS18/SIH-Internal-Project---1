import React, { useMemo, useState, useEffect, useRef } from 'react';
import { IndiaMap } from '@/components/IndiaMap';
import { ALL_INDIAN_DISTRICTS } from '@/lib/districtsCatalog';
import { useLanguage } from '@/i18n/LanguageContext';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { JourneyNav } from '@/components/JourneyNav';
import { MagneticButton } from '@/components/ui/motion';
import { ReadingRow } from '@/components/ui/ReadingRow';
import { usePrefersReducedMotion, useMounted } from '@/lib/hooks';
import type { DistrictLocationItem } from '@/types/farm';
import {
  ArrowRight,
  Search,
  Navigation,
  CheckCircle2,
  AlertCircle,
  X,
  Crosshair,
  Check,
} from 'lucide-react';

interface WelcomeScreenProps {
  userName?: string;
  onLogout: () => void;
  onConfirmLocation: (stateName: string, districtName: string) => void;
}

const POPULAR_AGRO_STATES = [
  'Madhya Pradesh',
  'Maharashtra',
  'Uttar Pradesh',
  'Punjab',
  'Rajasthan',
  'Karnataka',
];

/** Registration marks, the way a printed survey sheet is squared up. */
const CORNER_TICKS = ['left-0 top-0', 'right-0 top-0', 'left-0 bottom-0', 'right-0 bottom-0'];

/**
 * Haversine Great-Circle Distance on Earth (in km)
 */
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest Indian district centroid with geodesic precision
 */
function findNearestDistrictPrecise(lat: number, lon: number): { district: DistrictLocationItem; distanceKm: number } {
  let closest = ALL_INDIAN_DISTRICTS[0];
  let minDistance = Infinity;
  for (const d of ALL_INDIAN_DISTRICTS) {
    const dist = haversineDistanceKm(lat, lon, d.latitude, d.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      closest = d;
    }
  }
  return { district: closest, distanceKm: Math.round(minDistance * 10) / 10 };
}

/**
 * PLACE THE FARM — the second beat of the journey.
 *
 * The survey chart is the hero and it now sits in the open air of the same ivory
 * world as every other screen: no laminated blue plate, no card around the
 * controls, and the chosen state is living field green rather than a foreign
 * accent colour. The place is read back through the same eyebrow-hairline-value
 * row the planning flow and the analysis cinematic use.
 *
 * Every piece of location logic is preserved verbatim: geolocation, the
 * Nominatim reverse-geocode with its 3.5s abort, the Haversine fallback, search
 * across states and districts in both languages, and the district picker.
 */
export function WelcomeScreen({
  userName = 'Demo Farmer',
  onLogout,
  onConfirmLocation,
}: WelcomeScreenProps) {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const reduced = usePrefersReducedMotion();
  const mounted = useMounted(60);

  // State selection and District state
  const [chosenState, setChosenState] = useState<string | null>('Madhya Pradesh');
  const [chosenDistrict, setChosenDistrict] = useState<string>('Agar Malwa');

  // Location search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [geoSuccess, setGeoSuccess] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Unique list of states
  const allStates = useMemo(() => {
    const set = new Set(ALL_INDIAN_DISTRICTS.map((d) => d.state_name));
    return Array.from(set).sort();
  }, []);

  // Get districts for chosen state
  const stateDistricts = useMemo(() => {
    if (!chosenState) return [];
    const list = ALL_INDIAN_DISTRICTS.filter(
      (d) => d.state_name.toLowerCase() === chosenState.toLowerCase()
    ).map((d) => d.district_name);
    return Array.from(new Set(list)).sort();
  }, [chosenState]);

  // Search autocomplete results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const matchedStates = allStates
      .filter((s) => {
        const localized = getStateDisplayName(s, language).toLowerCase();
        return s.toLowerCase().includes(q) || localized.includes(q);
      })
      .map((s) => ({ type: 'state' as const, name: s, label: getStateDisplayName(s, language) }));

    const matchedDistricts = ALL_INDIAN_DISTRICTS.filter((d) => {
      const localized = getDistrictDisplayName(d.district_name, language).toLowerCase();
      return (
        d.district_name.toLowerCase().includes(q) ||
        localized.includes(q)
      );
    })
      .slice(0, 10)
      .map((d) => ({
        type: 'district' as const,
        name: d.district_name,
        stateName: d.state_name,
        label: `${getDistrictDisplayName(d.district_name, language)}, ${getStateDisplayName(d.state_name, language)}`,
      }));

    return [...matchedStates, ...matchedDistricts].slice(0, 10);
  }, [searchQuery, allStates, language]);

  // Handle map state click
  const handleMapStateSelect = (_code: string, stateName?: string) => {
    if (stateName) {
      setChosenState(stateName);
      const districts = ALL_INDIAN_DISTRICTS.filter(
        (d) => d.state_name.toLowerCase() === stateName.toLowerCase()
      ).map((d) => d.district_name);
      if (districts.length > 0) {
        setChosenDistrict(districts[0]);
      }
      setGeoNotice(null);
      setGeoSuccess(null);
    }
  };

  // Handle selecting from search
  const handleSelectSearchResult = (result: (typeof searchResults)[0]) => {
    if (result.type === 'state') {
      handleMapStateSelect('en', result.name);
    } else {
      setChosenState(result.stateName);
      setChosenDistrict(result.name);
      setGeoNotice(null);
      setGeoSuccess(null);
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  // Geolocation handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice(isHi ? 'स्थान पहुंच उपलब्ध नहीं है।' : 'Geolocation access is not available.');
      return;
    }

    setIsLocating(true);
    setGeoNotice(null);
    setGeoSuccess(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let matchedDistrict: DistrictLocationItem | null = null;
        let distKm = 0;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
            { signal: controller.signal, headers: { 'Accept-Language': 'en' } }
          );
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const revDistrict = (addr.state_district || addr.county || addr.city || addr.district || '').toLowerCase().trim();

            if (revDistrict) {
              const exact = ALL_INDIAN_DISTRICTS.find(
                (d) =>
                  d.district_name.toLowerCase().includes(revDistrict) ||
                  revDistrict.includes(d.district_name.toLowerCase())
              );
              if (exact) {
                matchedDistrict = exact;
                distKm = Math.round(haversineDistanceKm(latitude, longitude, exact.latitude, exact.longitude) * 10) / 10;
              }
            }
          }
        } catch {
          // Fallback to Haversine
        }

        if (!matchedDistrict) {
          const result = findNearestDistrictPrecise(latitude, longitude);
          matchedDistrict = result.district;
          distKm = result.distanceKm;
        }

        setIsLocating(false);
        setChosenState(matchedDistrict.state_name);
        setChosenDistrict(matchedDistrict.district_name);

        const distStr = distKm > 0 ? ` (~${distKm} km)` : '';
        setGeoSuccess(
          `${isHi ? 'स्थान पहचाना गया:' : 'Detected:'} ${getDistrictDisplayName(matchedDistrict.district_name, language)}, ${getStateDisplayName(matchedDistrict.state_name, language)}${distStr}`
        );
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        setGeoNotice(isHi ? 'स्थान अनुमति अस्वीकार कर दी गई।' : 'Location permission denied.');
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  // Submit selected location and proceed to Page 3
  const handleProceedToFarm = () => {
    if (!chosenState) return;
    const finalDistrict = chosenDistrict || stateDistricts[0] || 'Bhopal';
    onConfirmLocation(chosenState, finalDistrict);
  };

  const rise = (i: number): React.CSSProperties =>
    reduced
      ? {}
      : {
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(18px)',
          transition: `opacity 0.7s var(--ease-out) ${i * 90}ms, transform 0.8s var(--ease-out) ${i * 90}ms`,
        };

  return (
    <div className="relative flex min-h-screen w-full flex-col text-[var(--ink)] selection:bg-[var(--field-tint)] selection:text-[var(--field-deep)]">
      {/* Floating chrome — the journey pill marks this as stage 01 */}
      <JourneyNav stage={1} userName={userName} onLogout={onLogout} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-10 pt-24 sm:px-8 sm:pt-28">
        {/* ================================================================= */}
        {/* THE ASK                                                            */}
        {/* ================================================================= */}
        <div style={rise(0)}>
          <div className="t-eyebrow" style={{ color: 'var(--field)' }}>
            {isHi ? 'अपना खेत पिन करें' : 'Pin your field'}
          </div>
          <h1 className="t-h1 mt-3 text-[var(--ink)]">
            {isHi ? 'आपका खेत कहाँ है?' : 'Where is your farm?'}
          </h1>
          <p className="t-lead mt-2.5 max-w-xl text-[0.95rem]">
            {isHi
              ? 'चार्ट पर अपना राज्य चुनें, फिर जिला — या GPS से स्वतः पहचान करें। हर पूर्वानुमान और सिफ़ारिश इसी जगह के अनुसार तय होती है।'
              : 'Pick your state on the chart, then your district — or let GPS find it. Every forecast and recommendation is tuned to this exact place.'}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
          {/* =============================================================== */}
          {/* THE CONTROLS — open, hairline-separated                          */}
          {/* =============================================================== */}
          <div className="order-2 space-y-8 lg:order-1 lg:col-span-5" style={rise(1)}>
            {/* --- GPS ---------------------------------------------------- */}
            <div>
              <div className="flex items-baseline gap-3">
                <span className="t-eyebrow shrink-0 text-[var(--ink-ghost)]">
                  {isHi ? 'स्वतः' : 'Automatically'}
                </span>
                <span className="h-px flex-1 -translate-y-1" style={{ background: 'var(--line-soft)' }} aria-hidden />
              </div>

              <MagneticButton
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                strength={0.2}
                className="btn btn-ghost mt-3 w-full disabled:opacity-60"
              >
                {isLocating ? (
                  <Crosshair size={15} className="animate-spin text-[var(--field)]" />
                ) : (
                  <Navigation size={15} className="text-[var(--field)]" />
                )}
                <span>
                  {isLocating
                    ? isHi
                      ? 'स्थान खोजा जा रहा है...'
                      : 'Detecting location…'
                    : isHi
                      ? 'मेरा स्थान उपयोग करें'
                      : 'Use my location'}
                </span>
              </MagneticButton>

              {geoSuccess && (
                <p
                  role="status"
                  className="mt-3 flex items-start gap-2 border-l-2 border-[var(--field)] pl-2.5 text-xs font-medium leading-snug text-[var(--field-deep)]"
                >
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--field)]" />
                  <span>{geoSuccess}</span>
                </p>
              )}
              {geoNotice && (
                <p
                  role="status"
                  className="mt-3 flex items-start gap-2 border-l-2 border-[var(--warn)] pl-2.5 text-xs font-medium leading-snug text-[var(--ink-soft)]"
                >
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-[var(--warn)]" />
                  <span>{geoNotice}</span>
                </p>
              )}
            </div>

            {/* --- SEARCH ------------------------------------------------- */}
            <div>
              <div className="flex items-baseline gap-3">
                <span className="t-eyebrow shrink-0 text-[var(--ink-ghost)]">
                  {isHi ? 'या नाम से' : 'Or by name'}
                </span>
                <span className="h-px flex-1 -translate-y-1" style={{ background: 'var(--line-soft)' }} aria-hidden />
              </div>

              <div className="relative mt-3" ref={searchContainerRef}>
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[var(--ink-ghost)]">
                  <Search size={15} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder={isHi ? 'राज्य या जिला खोजें...' : 'Search state or district…'}
                  className="line-input pl-7 pr-7 text-sm"
                  aria-label={isHi ? 'राज्य या जिला खोजें' : 'Search state or district'}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    aria-label={isHi ? 'खोज साफ़ करें' : 'Clear search'}
                    className="absolute inset-y-0 right-0 flex items-center text-[var(--ink-ghost)] transition-colors hover:text-[var(--ink-soft)]"
                  >
                    <X size={14} />
                  </button>
                )}

                {isSearchOpen && searchResults.length > 0 && (
                  <div className="panel-elevated absolute left-0 right-0 top-full z-40 mt-2 max-h-56 overflow-y-auto p-1.5">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSearchResult(item)}
                        className="flex w-full items-center justify-between gap-2 rounded-[12px] px-3 py-2 text-left text-[13px] text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-inset)] hover:text-[var(--ink)] focus-visible:bg-[var(--field-tint)] focus-visible:text-[var(--field-deep)] focus-visible:outline-none"
                      >
                        <span className="truncate font-medium">{item.label}</span>
                        <span className="font-data shrink-0 text-[9px] uppercase tracking-[0.14em] text-[var(--ink-ghost)]">
                          {item.type === 'state' ? (isHi ? 'राज्य' : 'State') : (isHi ? 'जिला' : 'District')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* popular agro states */}
              <div className="mt-5">
                <span className="t-eyebrow mb-2 block text-[0.6rem] text-[var(--ink-ghost)]">
                  {isHi ? 'प्रमुख कृषि राज्य' : 'Major farming states'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_AGRO_STATES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      aria-pressed={chosenState?.toLowerCase() === st.toLowerCase()}
                      onClick={() => handleMapStateSelect('en', st)}
                      className="choice items-center px-3 py-1.5 text-xs font-medium"
                    >
                      {getStateDisplayName(st, language)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* --- DISTRICT ----------------------------------------------- */}
            {chosenState && (
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="t-eyebrow shrink-0 text-[var(--ink-ghost)]">
                    {isHi ? 'जिला' : 'District'}
                  </span>
                  <span className="h-px flex-1 -translate-y-1" style={{ background: 'var(--line-soft)' }} aria-hidden />
                  <span className="font-data shrink-0 text-[11px] text-[var(--ink-ghost)]">
                    {stateDistricts.length}
                  </span>
                </div>

                <div className="mt-3 max-h-[15rem] overflow-y-auto pr-1">
                  {stateDistricts.map((d) => {
                    const isSelected = chosenDistrict?.toLowerCase() === d.toLowerCase();
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setChosenDistrict(d)}
                        className={`flex w-full items-center justify-between gap-2 border-l-2 py-[7px] pl-2.5 pr-1 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--field)] ${
                          isSelected
                            ? 'border-[var(--field)] font-semibold text-[var(--field-deep)]'
                            : 'border-transparent text-[var(--ink-soft)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]'
                        }`}
                      >
                        <span className="truncate">{getDistrictDisplayName(d, language)}</span>
                        {isSelected && <Check size={13} className="shrink-0 text-[var(--field)]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- READING + HAND OFF ------------------------------------- */}
            <div className="border-t border-[var(--line-soft)] pt-6">
              {chosenState && chosenDistrict ? (
                <div className="space-y-2.5">
                  <ReadingRow
                    label={isHi ? 'राज्य' : 'State'}
                    value={getStateDisplayName(chosenState, language)}
                  />
                  <ReadingRow
                    label={isHi ? 'जिला' : 'District'}
                    value={getDistrictDisplayName(chosenDistrict, language)}
                  />
                </div>
              ) : (
                <p className="text-xs text-[var(--ink-ghost)]">
                  {isHi ? 'शुरू करने के लिए चार्ट पर एक राज्य चुनें।' : 'Pick a state on the chart to begin.'}
                </p>
              )}

              <MagneticButton
                type="button"
                onClick={handleProceedToFarm}
                disabled={!chosenState || !chosenDistrict}
                className="btn btn-primary btn-lg group mt-5 w-full disabled:opacity-50"
              >
                <span>{isHi ? 'खेत की जानकारी दर्ज करें' : 'Continue to farm setup'}</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </MagneticButton>
            </div>
          </div>

          {/* =============================================================== */}
          {/* THE SURVEY CHART — hero, in the open air                        */}
          {/* =============================================================== */}
          <div className="order-1 lg:order-2 lg:col-span-7" style={rise(2)}>
            <div className="lg:sticky lg:top-28">
              <div className="relative mx-auto w-full max-w-[460px] px-3 py-3">
                {/* survey paper, no frame: a masked grid that fades to nothing */}
                <div className="grid-survey pointer-events-none absolute inset-0" aria-hidden />
                {CORNER_TICKS.map((pos) => (
                  <span
                    key={pos}
                    className={`font-data pointer-events-none absolute ${pos} text-[11px] leading-none text-[var(--ink-ghost)]`}
                    aria-hidden
                  >
                    +
                  </span>
                ))}
                <div className="relative aspect-[612/696] w-full">
                  <IndiaMap
                    selectedStateName={chosenState || undefined}
                    onSelect={handleMapStateSelect}
                    transitioning={false}
                  />
                </div>
              </div>

              <div className="mx-auto mt-1 flex w-full max-w-[460px] items-center justify-between gap-3 px-3">
                <span className="t-eyebrow text-[0.6rem] text-[var(--ink-ghost)]">
                  {isHi ? 'भारत कृषि सर्वेक्षण चार्ट · राज्य चुनें' : 'India agri-survey chart · tap a state'}
                </span>
                {chosenState && (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--field-tint)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--field-deep)]">
                    <span className="animate-breathe h-1 w-1 rounded-full bg-[var(--field)]" />
                    {getStateDisplayName(chosenState, language)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================================================================= */}
      {/* FOOTER                                                            */}
      {/* ================================================================= */}
      <footer className="relative z-10 px-5 pb-24 pt-4 text-xs text-[var(--ink-faint)] sm:px-8 md:pb-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-3 text-[11px]">
          <span>
            {isHi
              ? '786+ भारतीय जिलों के लिए भू-सटीक कृषि डेटा'
              : 'Geodesic coverage across 786+ Indian agricultural districts'}
          </span>
          <span>© 2026 AgriOptima AI</span>
        </div>
      </footer>
    </div>
  );
}
