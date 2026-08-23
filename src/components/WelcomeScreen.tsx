import React, { useMemo, useState, useEffect, useRef } from 'react';
import { IndiaMap } from '@/components/IndiaMap';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { ALL_INDIAN_DISTRICTS } from '@/lib/districtsCatalog';
import { useLanguage } from '@/i18n/LanguageContext';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { LanguageSelector } from '@/components/LanguageSelector';
import type { DistrictLocationItem } from '@/types/farm';
import {
  User,
  LogOut,
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Search,
  Navigation,
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  X,
  Crosshair,
} from 'lucide-react';

const BACKGROUND_IMAGE = '/pg2bg.png';

interface WelcomeScreenProps {
  userName?: string;
  onLogout: () => void;
  onConfirmLocation: (stateName: string, districtName: string) => void;
}

const STARS = Array.from({ length: 18 }, (_, id) => ({
  id,
  top: 6 + Math.random() * 45,
  left: Math.random() * 100,
  size: 1 + Math.random() * 2,
  delay: Math.random() * 5,
  duration: 3 + Math.random() * 5,
}));

const PARTICLES = Array.from({ length: 12 }, (_, id) => ({
  id,
  top: 20 + Math.random() * 70,
  left: Math.random() * 100,
  size: 1.5 + Math.random() * 2,
  delay: Math.random() * 8,
  duration: 6 + Math.random() * 8,
}));

const POPULAR_AGRO_STATES = [
  'Uttar Pradesh',
  'Maharashtra',
  'Madhya Pradesh',
  'Punjab',
  'Rajasthan',
  'Karnataka',
];

/**
 * Haversine Great-Circle Distance on Earth (in km)
 */
function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth mean radius in km
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
 * Finds the nearest Indian district centroid with high geodesic precision
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

export function WelcomeScreen({
  userName = 'Demo Farmer',
  onLogout,
  onConfirmLocation,
}: WelcomeScreenProps) {
  const reduced = usePrefersReducedMotion();
  const { t, language } = useLanguage();
  const stars = useMemo(() => STARS, []);
  const particles = useMemo(() => PARTICLES, []);

  // State selection and District state
  const [chosenState, setChosenState] = useState<string | null>(null);
  const [chosenDistrict, setChosenDistrict] = useState<string>('');

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

    return [...matchedStates, ...matchedDistricts].slice(0, 12);
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
      } else {
        setChosenDistrict('');
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

  // High-accuracy browser geolocation with geodesic fallback
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice(t('map.locationDenied'));
      return;
    }

    setIsLocating(true);
    setGeoNotice(null);
    setGeoSuccess(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        let matchedDistrict: DistrictLocationItem | null = null;
        let distKm = 0;

        // 1. Attempt reverse geocoding for exact administrative district
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
          // Geocoding network timeout/error: proceed seamlessly with geodesic Haversine
        }

        // 2. High-precision Haversine fallback over all 786+ Indian district centroids
        if (!matchedDistrict) {
          const result = findNearestDistrictPrecise(latitude, longitude);
          matchedDistrict = result.district;
          distKm = result.distanceKm;
        }

        setIsLocating(false);
        setChosenState(matchedDistrict.state_name);
        setChosenDistrict(matchedDistrict.district_name);

        const accuracyStr = accuracy && accuracy < 1000 ? ` (±${Math.round(accuracy)}m)` : '';
        const distStr = distKm > 0 ? ` • ~${distKm} ${t('map.kmAway')}` : '';
        setGeoSuccess(
          `${t('map.locationDetected')} ${getDistrictDisplayName(matchedDistrict.district_name, language)}, ${getStateDisplayName(matchedDistrict.state_name, language)}${distStr}${accuracyStr}`
        );
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation access failed/denied:', err);
        setGeoNotice(t('map.locationDenied'));
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  // Submit the selected state & district to enter farm intelligence
  const handleProceedToFarm = () => {
    if (!chosenState) return;
    const finalDistrict = chosenDistrict || stateDistricts[0] || 'Center';
    onConfirmLocation(chosenState, finalDistrict);
  };

  return (
    <section
      className="relative min-h-screen w-full overflow-x-hidden bg-forest-950 text-cream-100 flex flex-col justify-between selection:bg-gold-400 selection:text-forest-950"
      role="region"
      aria-label="AgriOptima AI State Selection"
    >
      {/* Background aesthetic layers */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <img
          src={BACKGROUND_IMAGE}
          alt="Agricultural landscape"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-85 brightness-95 select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/80 via-forest-950/60 to-forest-950/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/60 via-transparent to-forest-950/60" />
        <div className="absolute inset-0 grid-texture radial-fade opacity-15" />

        {/* Ambient stars and particles */}
        {stars.map((star) => (
          <span
            key={star.id}
            className="absolute rounded-full bg-cream-100"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: star.size,
              height: star.size,
              animation: reduced
                ? undefined
                : `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
              boxShadow: '0 0 4px rgba(255,249,232,0.6)',
            }}
          />
        ))}
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="absolute rounded-full bg-gold-200/40"
            style={{
              top: `${particle.top}%`,
              left: `${particle.left}%`,
              width: particle.size,
              height: particle.size,
              animation: reduced
                ? undefined
                : `drift ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex min-h-screen flex-col justify-between">
        
        {/* ===================================================================== */}
        {/* 1. TOP NAVIGATION BAR */}
        {/* ===================================================================== */}
        <header className="flex shrink-0 items-center justify-between px-5 py-3 sm:px-8 lg:px-12 border-b border-gold-300/10 bg-forest-950/60 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="AgriOptima AI"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-contain border border-gold-300/40 bg-forest-900/90 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-base font-bold text-cream-100">
                  AgriOptima AI
                </span>
                <span className="font-mono text-[10px] text-gold-300 sm:inline">
                  • SIH 2026
                </span>
              </div>
            </div>
          </div>

          {/* User Session, Language & Logout */}
          <div className="flex items-center gap-2.5">
            <LanguageSelector />

            <div className="flex items-center gap-1.5 rounded-full border border-gold-300/25 bg-forest-900/80 px-3 py-1 text-xs text-cream-100 shadow-sm">
              <User size={13} className="text-gold-300" />
              <span className="font-medium">{userName}</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 rounded-full border border-forest-700/60 bg-forest-950/70 p-1.5 sm:px-3 sm:py-1 text-xs font-mono text-cream-300/70 hover:border-pink-500/50 hover:bg-pink-950/40 hover:text-pink-300 transition-colors"
              title={t('login.logout')}
            >
              <LogOut size={12} />
              <span className="hidden sm:inline">{t('login.logout')}</span>
            </button>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* 2. HERO HEADER (CLEAN) */}
        {/* ===================================================================== */}
        <div className="flex shrink-0 flex-col items-center px-4 pt-2.5 sm:pt-3 text-center">
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-cream-100">
            {t('map.title')}
          </h1>
          <p className="mt-1 max-w-xl text-[11px] sm:text-xs font-mono uppercase tracking-wider text-cream-300/80">
            {t('map.subtitle')}
          </p>
        </div>

        {/* ===================================================================== */}
        {/* 3. MAIN WORKSPACE: COMPACT SEARCH PANEL & CENTERED/LEFT-ALIGNED MAP */}
        {/* ===================================================================== */}
        <main className="flex-1 flex items-center justify-center px-4 py-2 sm:px-8">
          <div className="mx-auto w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10">
            
            {/* LEFT: Compact Location Search Panel */}
            <div className="w-full max-w-[310px] shrink-0 order-2 lg:order-1">
              <div
                ref={searchContainerRef}
                className="relative rounded-2xl border border-gold-300/25 bg-forest-950/90 p-4 shadow-xl backdrop-blur-xl space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gold-300/15 pb-2">
                  <label className="font-serif text-sm font-bold text-cream-100 flex items-center gap-1.5">
                    <MapPin size={15} className="text-gold-300 shrink-0" />
                    <span>{t('map.searchLabel')}</span>
                  </label>
                  <span className="font-mono text-[9px] text-cream-300/60">
                    {ALL_INDIAN_DISTRICTS.length}+ {t('map.districtsCount')}
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cream-300/50 pointer-events-none">
                    <Search size={13} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder={t('map.searchPlaceholder')}
                    className="w-full rounded-xl border border-gold-300/30 bg-forest-900/90 py-2 pl-8 pr-8 text-xs text-cream-100 placeholder:text-cream-300/40 focus:border-gold-300 focus:outline-none focus:ring-1 focus:ring-gold-300/50 transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-cream-300/50 hover:text-cream-100"
                    >
                      <X size={13} />
                    </button>
                  )}

                  {/* Autocomplete Dropdown List */}
                  {isSearchOpen && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-52 overflow-y-auto rounded-xl border border-gold-300/40 bg-forest-950/98 p-1 shadow-2xl backdrop-blur-2xl divide-y divide-gold-300/5">
                      {searchResults.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectSearchResult(item)}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-cream-200 hover:bg-forest-800/90 hover:text-gold-200 transition-colors"
                        >
                          <span className="font-medium truncate pr-2 text-[11px]">{item.label}</span>
                          <span className="shrink-0 font-mono text-[8px] uppercase px-1 py-0.5 rounded bg-forest-900 border border-forest-700/50 text-gold-300">
                            {item.type === 'state' ? t('map.stateLabel') : t('map.districtLabel')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {isSearchOpen && searchQuery.trim().length > 1 && searchResults.length === 0 && (
                    <div className="absolute left-0 right-0 top-full z-40 mt-1 rounded-xl border border-forest-800 bg-forest-950/98 p-2.5 text-center text-[11px] text-cream-300/60 shadow-2xl backdrop-blur-2xl">
                      {t('map.noResultsFound')}
                    </div>
                  )}
                </div>

                {/* Popular Agro Regions Quick Selection */}
                <div className="space-y-1 pt-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-cream-300/60 block">
                    {t('map.popularStates')}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_AGRO_STATES.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleMapStateSelect('en', st)}
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-mono transition-all duration-200 ${
                          chosenState?.toLowerCase() === st.toLowerCase()
                            ? 'border-gold-300 bg-gold-400/20 text-gold-200 font-bold shadow-sm'
                            : 'border-gold-300/20 bg-forest-900/60 text-cream-300/80 hover:border-gold-300/50 hover:bg-forest-900 hover:text-cream-100'
                        }`}
                      >
                        {getStateDisplayName(st, language)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* High-Accuracy GPS Action: Use My Location */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={isLocating}
                    className="group relative flex w-full items-center justify-center gap-1.5 rounded-xl border border-gold-300/35 bg-gradient-to-r from-forest-900 via-forest-850 to-forest-900 py-2.5 font-mono text-xs text-gold-200 hover:border-gold-300/70 hover:text-white hover:shadow-[0_0_12px_rgba(255,210,26,0.2)] transition-all duration-200 disabled:opacity-50"
                  >
                    {isLocating ? (
                      <Crosshair size={13} className="animate-spin text-gold-300" />
                    ) : (
                      <Navigation size={13} className="text-gold-300 transition-transform group-hover:scale-110" />
                    )}
                    <span className="font-semibold text-[11px]">
                      {isLocating ? t('map.detectingLocation') : t('map.useMyLocation')}
                    </span>
                  </button>
                </div>

                {/* Geolocation Feedback Notifications */}
                {geoSuccess && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/60 p-2.5 text-[11px] text-emerald-200 animate-in fade-in">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{geoSuccess}</span>
                  </div>
                )}

                {geoNotice && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-950/60 p-2.5 text-[11px] text-amber-200 animate-in fade-in">
                    <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{geoNotice}</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Shifted-Left Interactive India Map */}
            <div className="w-full max-w-[500px] flex items-center justify-center order-1 lg:order-2 shrink-0 lg:-ml-3">
              <div className="relative w-full max-w-[480px] aspect-[612/696] flex items-center justify-center">
                <IndiaMap
                  selectedStateName={chosenState}
                  onSelect={handleMapStateSelect}
                  transitioning={false}
                />
              </div>
            </div>

          </div>

          {/* District Selection Overlay Modal (Appears when a State is selected) */}
          {chosenState && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/85 px-4 backdrop-blur-md transition-all duration-300 animate-in fade-in">
              <div className="w-full max-w-md rounded-2xl border border-gold-300/40 bg-gradient-to-b from-forest-900/95 to-forest-950/98 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-7 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gold-300/15 pb-3">
                  <div className="flex items-center gap-2 text-gold-300">
                    <MapPin size={16} />
                    <span className="font-mono text-[10px] uppercase tracking-wider font-bold">
                      {t('map.stateSelected')}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-cream-300/60">
                    {stateDistricts.length} {t('map.districtsAvailable')}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="font-serif text-xl font-bold text-cream-100">
                    {t('map.selectLocationTitle')}
                  </h3>
                  <p className="mt-1 text-xs text-cream-300/70">
                    {t('map.selectDistrictSubtitle')}
                  </p>
                </div>

                {/* State & District Dropdowns */}
                <div className="mt-5 space-y-3.5">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                      {t('map.stateLabel')}
                    </label>
                    <div className="mt-1 flex items-center justify-between rounded-xl border border-gold-300/20 bg-forest-950/70 px-3.5 py-2.5 text-xs font-semibold text-gold-200">
                      <span>{getStateDisplayName(chosenState, language)}</span>
                      <span className="rounded bg-gold-300/10 px-2 py-0.5 font-mono text-[10px] text-gold-300">
                        {t('map.pinned')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                      {t('map.districtLabel')}
                    </label>
                    <div className="relative mt-1">
                      <select
                        value={chosenDistrict}
                        onChange={(e) => setChosenDistrict(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-gold-300/30 bg-forest-950/90 py-2.5 pl-3.5 pr-9 text-xs font-medium text-cream-100 focus:border-gold-300 focus:outline-none focus:ring-1 focus:ring-gold-300"
                      >
                        {stateDistricts.map((d) => (
                          <option key={d} value={d} className="bg-forest-950 text-cream-100">
                            {getDistrictDisplayName(d, language)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gold-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={handleProceedToFarm}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-300/50 bg-gradient-to-r from-gold-400 to-gold-500 py-3 font-serif text-xs font-bold text-forest-950 shadow-[0_0_20px_rgba(255,210,26,0.3)] transition-all duration-200 hover:brightness-110 focus:outline-none"
                  >
                    <Sparkles size={14} />
                    <span>{t('map.openIntelligence')}</span>
                    <ArrowRight size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setChosenState(null)}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gold-300/15 bg-forest-950/50 py-2 font-mono text-xs text-cream-300/80 transition-colors hover:border-gold-300/40 hover:text-cream-100 focus:outline-none"
                  >
                    <ArrowLeft size={13} />
                    <span>{t('map.changeState')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ===================================================================== */}
        {/* 4. BOTTOM INSTRUCTION & HASHTAG BAR */}
        {/* ===================================================================== */}
        <footer className="flex shrink-0 items-center justify-between px-5 py-3 border-t border-gold-300/10 bg-forest-950/80 backdrop-blur-md sm:px-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold-300/55">
            {t('brand.portalHashtag')}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-cream-300/75">
            {t('map.instruction')}
          </span>
        </footer>

      </div>
    </section>
  );
}
