import React, { useMemo, useState, useEffect, useRef } from 'react';
import { IndiaMap } from '@/components/IndiaMap';
import { ALL_INDIAN_DISTRICTS } from '@/lib/districtsCatalog';
import { useLanguage } from '@/i18n/LanguageContext';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { JourneyNav } from '@/components/JourneyNav';
import { MagneticButton } from '@/components/ui/motion';
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
 * ENTER — the second beat of the flow: place the farm on the map of India.
 * The interactive survey chart is the hero; all selection controls live in one
 * calm floating panel. Every piece of location logic (geolocation, Nominatim
 * reverse-geocode, Haversine fallback, search, district picker) is preserved.
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

      {/* ================================================================= */}
      {/* MAIN                                                              */}
      {/* ================================================================= */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 pb-6 pt-24 sm:px-8 sm:pt-28">
        <div className="mb-6" style={rise(0)}>
          <div className="t-eyebrow" style={{ color: 'var(--field)' }}>
            {isHi ? 'अपना खेत पिन करें' : 'Pin your field'}
          </div>
          <h1 className="t-h1 mt-2 text-[var(--ink)]">
            {isHi ? 'आपका खेत कहाँ है?' : 'Where is your farm?'}
          </h1>
          <p className="t-lead mt-2 max-w-xl text-[0.98rem]">
            {isHi
              ? 'सटीक मौसम, मिट्टी और मंडी डेटा के लिए मानचित्र से अपना राज्य और जिला चुनें — या स्वतः पहचान का उपयोग करें।'
              : 'Choose your state and district from the survey map — or let us detect it — so every forecast and recommendation is tuned to your exact field.'}
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* ---------------------------------------------------------- */}
          {/* LEFT — one calm control panel                               */}
          {/* ---------------------------------------------------------- */}
          <div
            ref={searchContainerRef}
            className="panel-elevated space-y-5 p-5 sm:p-6 lg:col-span-5 xl:col-span-4"
            style={rise(1)}
          >
            {/* GPS auto-detect */}
            <div>
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--grain-tint)] text-[var(--grain-deep)] leaf-radius">
                  <Navigation size={17} />
                </span>
                <div>
                  <h2 className="t-h3 text-[1.05rem] text-[var(--ink)]">
                    {isHi ? 'मेरा स्थान खोजें' : 'Find my location'}
                  </h2>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {isHi
                      ? 'GPS द्वारा तुरंत अपने नजदीकी जिले का पता लगाएं।'
                      : 'Detect your nearest district automatically via GPS.'}
                  </p>
                </div>
              </div>

              <MagneticButton
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                strength={0.2}
                className="btn btn-primary mt-4 w-full text-xs disabled:opacity-60"
              >
                {isLocating ? <Crosshair size={14} className="animate-spin-slow" /> : <Navigation size={14} />}
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
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--field-tint)] bg-[var(--field-tint)] p-2.5 text-xs text-[var(--field-deep)]">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[var(--field)]" />
                  <span className="font-medium leading-tight">{geoSuccess}</span>
                </div>
              )}
              {geoNotice && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-inset)] p-2.5 text-xs text-[var(--ink-soft)]">
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-[var(--warn)]" />
                  <span className="font-medium leading-tight">{geoNotice}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--line)]" />
              <span className="t-eyebrow text-[0.6rem]">{isHi ? 'या मैन्युअल' : 'or by hand'}</span>
              <div className="h-px flex-1 bg-[var(--line)]" />
            </div>

            {/* Search */}
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--ink-ghost)]">
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
                className="field-input !py-2.5 !pl-10 !pr-8 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  aria-label={isHi ? 'खोज साफ़ करें' : 'Clear search'}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[var(--ink-ghost)] hover:text-[var(--ink-soft)]"
                >
                  <X size={13} />
                </button>
              )}

              {isSearchOpen && searchResults.length > 0 && (
                <div className="panel-elevated absolute left-0 right-0 top-full z-40 mt-1 max-h-52 overflow-y-auto p-1">
                  {searchResults.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-inset)]"
                    >
                      <span className="truncate pr-2 font-medium">{item.label}</span>
                      <span className="shrink-0 rounded border border-[var(--line)] bg-[var(--surface-inset)] px-1.5 py-0.5 font-data text-[9px] uppercase text-[var(--ink-faint)]">
                        {item.type === 'state' ? (isHi ? 'राज्य' : 'State') : (isHi ? 'जिला' : 'District')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Popular states */}
            <div>
              <span className="t-eyebrow mb-2 block text-[0.6rem]">
                {isHi ? 'प्रमुख कृषि राज्य' : 'Popular agro states'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_AGRO_STATES.map((st) => {
                  const isSelected = chosenState?.toLowerCase() === st.toLowerCase();
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleMapStateSelect('en', st)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-[var(--field)] text-white shadow-sm'
                          : 'border border-[var(--line)] bg-[var(--surface-inset)] text-[var(--ink-soft)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {getStateDisplayName(st, language)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected location */}
            {chosenState && chosenDistrict && (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--field-tint)] bg-[var(--field-tint)] p-3.5">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="shrink-0 text-[var(--field)]" />
                  <div>
                    <span className="t-eyebrow block text-[0.58rem] text-[var(--field-deep)]">
                      {isHi ? 'चुना गया स्थान' : 'Selected location'}
                    </span>
                    <span className="text-sm font-semibold text-[var(--ink)]">
                      {getDistrictDisplayName(chosenDistrict, language)}, {getStateDisplayName(chosenState, language)}
                    </span>
                  </div>
                </div>
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[var(--field)]" />
              </div>
            )}

            <MagneticButton
              type="button"
              onClick={handleProceedToFarm}
              disabled={!chosenState || !chosenDistrict}
              className="btn btn-primary group w-full text-sm disabled:opacity-50"
            >
              <span>{isHi ? 'खेत की जानकारी दर्ज करें' : 'Continue to farm setup'}</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </MagneticButton>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* RIGHT — the survey chart (hero) + district picker            */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-7 xl:col-span-8" style={rise(2)}>
            <div className="panel flex flex-col items-center justify-between gap-5 p-4 sm:p-6 md:flex-row">
              {/* Illuminated survey chart plate */}
              <div className="relative w-full max-w-[430px]">
                <div
                  className="relative flex aspect-[612/696] items-center justify-center overflow-hidden rounded-2xl border border-[#9DC4D6] p-3 sm:p-4"
                  style={{
                    background: 'linear-gradient(180deg, #C9E0EB 0%, #BCD8E5 55%, #B0D0DE 100%)',
                    boxShadow: 'inset 0 2px 16px rgba(25,75,105,0.10)',
                  }}
                >
                  {/* cartographic corner ticks */}
                  {['left-2 top-2', 'right-2 top-2', 'left-2 bottom-2', 'right-2 bottom-2'].map((pos) => (
                    <span
                      key={pos}
                      className={`pointer-events-none absolute ${pos} font-data text-[10px] text-[#3E6D82]/60`}
                      aria-hidden
                    >
                      +
                    </span>
                  ))}
                  <IndiaMap
                    selectedStateName={chosenState || undefined}
                    onSelect={handleMapStateSelect}
                    transitioning={false}
                  />
                </div>
                <span className="t-eyebrow mt-2 block text-center text-[0.58rem] text-[var(--ink-faint)] md:text-left">
                  {isHi ? 'भारत कृषि सर्वेक्षण मानचित्र · राज्य चुनें' : 'India agri-survey chart · tap a state'}
                </span>
              </div>

              {/* District picker */}
              {chosenState && (
                <div className="w-full shrink-0 md:max-w-[250px]">
                  <div className="border-b border-[var(--line)] pb-2">
                    <span className="t-eyebrow block text-[0.58rem]">
                      {isHi ? 'चुना गया राज्य' : 'Selected state'}
                    </span>
                    <h3 className="t-h3 text-[1.05rem] text-[var(--ink)]">
                      {getStateDisplayName(chosenState, language)}
                    </h3>
                  </div>

                  <label className="mb-1.5 mt-3 block text-xs font-semibold text-[var(--ink-soft)]">
                    {isHi ? 'जिला चुनें' : 'Select district'}
                  </label>
                  <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                    {stateDistricts.map((d) => {
                      const isSelected = chosenDistrict?.toLowerCase() === d.toLowerCase();
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setChosenDistrict(d)}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                            isSelected
                              ? 'bg-[var(--field)] font-semibold text-white'
                              : 'border border-[var(--line)] bg-[var(--surface-inset)] text-[var(--ink-soft)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]'
                          }`}
                        >
                          <span>{getDistrictDisplayName(d, language)}</span>
                          {isSelected && <Check size={13} className="shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ================================================================= */}
      {/* FOOTER                                                            */}
      {/* ================================================================= */}
      <footer className="relative z-10 px-5 pb-24 pt-4 text-xs text-[var(--ink-faint)] sm:px-8 md:pb-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-[11px]">
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
