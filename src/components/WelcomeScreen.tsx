import React, { useMemo, useState, useEffect, useRef } from 'react';
import { IndiaMap } from '@/components/IndiaMap';
import { ALL_INDIAN_DISTRICTS } from '@/lib/districtsCatalog';
import { useLanguage } from '@/i18n/LanguageContext';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { LanguageSelector } from '@/components/LanguageSelector';
import type { DistrictLocationItem } from '@/types/farm';
import {
  User,
  LogOut,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Search,
  Navigation,
  CheckCircle2,
  ChevronDown,
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

export function WelcomeScreen({
  userName = 'Demo Farmer',
  onLogout,
  onConfirmLocation,
}: WelcomeScreenProps) {
  const { t, language } = useLanguage();
  const isHi = language === 'hi';

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

  return (
    <div className="relative min-h-screen w-full bg-transparent text-[#1F2937] flex flex-col justify-between selection:bg-[#E2725B]/20 selection:text-[#873322]">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER BAR */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-30 border-b border-[#EDE4D5] bg-[#FAF7F2]/90 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLogout}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EDE4D5] bg-[#FFFFFF] text-[#4B5563] hover:bg-[#F5EFE6] transition-colors"
              title={isHi ? 'पीछे जाएं' : 'Back to Login'}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-[#1F2937]">
                  AgriOptima AI
                </span>
                <span className="rounded-full bg-[#EAF3ED] px-2.5 py-0.5 text-[10px] font-semibold text-[#2D5A43] border border-[#D4E7DC]">
                  {isHi ? 'चरण 2/4: स्थान चयन' : 'Step 2/4: Location'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <LanguageSelector />

            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#EDE4D5] bg-[#FFFFFF] px-3 py-1 text-xs text-[#374151] shadow-sm">
              <User size={13} className="text-[#E2725B]" />
              <span className="font-medium">{userName}</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1 rounded-xl border border-[#EDE4D5] bg-[#FFFFFF] px-2.5 py-1 text-xs text-[#6B7280] hover:text-[#B54832] hover:border-[#F9D0C5] transition-colors"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">{isHi ? 'लॉगआउट' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. MAIN 2-COLUMN LOCATION WORKSPACE */}
      {/* ===================================================================== */}
      <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full flex flex-col justify-center">
        {/* Title Header */}
        <div className="mb-6 text-center sm:text-left">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1F2937]">
            {isHi ? 'अपने खेत का स्थान चुनें' : 'Select Your Location'}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6B7280]">
            {isHi
              ? 'सटीक मौसम और मिट्टी की जानकारी के लिए अपने राज्य और जिले का चयन करें।'
              : "Select your farm's state and district from the map or use automatic location."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* =================================================================== */}
          {/* LEFT: LOCATION CONTROLS & SELECTION (Slightly more compact width) */}
          {/* =================================================================== */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            
            {/* Automatic Location Card */}
            <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 sm:p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FDEEE9] text-[#E2725B]">
                  <Navigation size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1F2937]">
                    {isHi ? 'मेरा स्थान खोजें' : 'Find My Location'}
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {isHi
                      ? 'GPS द्वारा तुरंत अपने नजदीकी जिले का पता लगाएं।'
                      : "We'll detect your location to personalize your farm insights."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E2725B] py-2.5 text-xs font-bold text-[#FFFFFF] shadow-sm hover:bg-[#D9654D] transition-all cursor-pointer disabled:opacity-60"
              >
                {isLocating ? (
                  <Crosshair size={14} className="animate-spin" />
                ) : (
                  <Navigation size={14} />
                )}
                <span>{isLocating ? (isHi ? 'स्थान खोजा जा रहा है...' : 'Detecting location...') : (isHi ? 'मेरा स्थान उपयोग करें' : 'Find My Location')}</span>
              </button>

              {/* Feedback messages */}
              {geoSuccess && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#EAF3ED] border border-[#D4E7DC] p-2.5 text-xs text-[#2D5A43]">
                  <CheckCircle2 size={15} className="text-[#3F7253] shrink-0 mt-0.5" />
                  <span className="font-medium leading-tight">{geoSuccess}</span>
                </div>
              )}
              {geoNotice && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#FFFBEB] border border-[#FEF3C7] p-2.5 text-xs text-[#B45309]">
                  <AlertCircle size={15} className="text-[#D97706] shrink-0 mt-0.5" />
                  <span className="font-medium leading-tight">{geoNotice}</span>
                </div>
              )}
            </div>

            {/* Manual Selection Card */}
            <div ref={searchContainerRef} className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 sm:p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-sm font-bold text-[#1F2937]">
                  {isHi ? 'मैन्युअल रूप से चुनें' : 'Select Manually'}
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  {isHi ? 'मानचित्र से या खोज कर राज्य व जिला चुनें।' : 'Choose your state and district from the map.'}
                </p>
              </div>

              {/* Search Box */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder={isHi ? 'राज्य या जिला खोजें...' : 'Search state or district...'}
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF7F2] py-2 pl-9 pr-8 text-xs text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#E2725B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#E2725B]/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#9CA3AF] hover:text-[#4B5563]"
                  >
                    <X size={13} />
                  </button>
                )}

                {/* Autocomplete Dropdown */}
                {isSearchOpen && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-40 mt-1 max-h-52 overflow-y-auto rounded-xl border border-[#EDE4D5] bg-[#FFFFFF] p-1 shadow-lg divide-y divide-[#F3EFE6]">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSearchResult(item)}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-[#374151] hover:bg-[#FAF7F2] transition-colors"
                      >
                        <span className="font-medium truncate pr-2">{item.label}</span>
                        <span className="shrink-0 text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#FAF7F2] border border-[#EDE4D5] text-[#6B7280]">
                          {item.type === 'state' ? (isHi ? 'राज्य' : 'State') : (isHi ? 'जिला' : 'District')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular States Pills */}
              <div>
                <span className="text-[11px] font-semibold text-[#6B7280] block mb-1.5">
                  {isHi ? 'प्रमुख कृषि राज्य:' : 'Popular Agro States:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_AGRO_STATES.map((st) => {
                    const isSelected = chosenState?.toLowerCase() === st.toLowerCase();
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleMapStateSelect('en', st)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-[#E2725B] text-[#FFFFFF] shadow-sm font-semibold'
                            : 'bg-[#FAF7F2] border border-[#EDE4D5] text-[#4B5563] hover:border-[#D1D5DB] hover:bg-[#F5EFE6]'
                        }`}
                      >
                        {getStateDisplayName(st, language)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected State & District Confirmation Bar */}
              {chosenState && chosenDistrict && (
                <div className="rounded-xl border border-[#D4E7DC] bg-[#EAF3ED] p-3.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#3F7253] shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#2D5A43] block">
                        {isHi ? 'चुना गया स्थान' : 'Selected Location'}
                      </span>
                      <span className="text-xs font-bold text-[#1F2937]">
                        {getDistrictDisplayName(chosenDistrict, language)}, {getStateDisplayName(chosenState, language)}
                      </span>
                    </div>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-[#3F7253] animate-pulse shrink-0" />
                </div>
              )}

              {/* Continue CTA Button */}
              <button
                type="button"
                onClick={handleProceedToFarm}
                disabled={!chosenState || !chosenDistrict}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D5A43] py-3 text-xs font-bold text-[#FFFFFF] shadow-sm hover:bg-[#224432] transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isHi ? 'खेत की जानकारी दर्ज करें' : 'Continue to Farm Setup'}</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>

          {/* =================================================================== */}
          {/* RIGHT: INTERACTIVE INDIA MAP & DISTRICT PICKER (Slightly larger ~60-66% width) */}
          {/* =================================================================== */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center justify-center">
            <div className="w-full rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Map Canvas with Deeper Ocean Blue Background & Cartographic Elements */}
              <div className="relative w-full max-w-[430px] aspect-[612/696] flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#C9E0EB] via-[#BCD8E5] to-[#B0D0DE] p-3 sm:p-4 border border-[#9DC4D6] shadow-[inset_0_2px_14px_rgba(25,75,105,0.08)]">
                <IndiaMap
                  selectedStateName={chosenState || undefined}
                  onSelect={handleMapStateSelect}
                  transitioning={false}
                />
              </div>

              {/* State Districts Selection Card */}
              {chosenState && (
                <div className="w-full md:max-w-[250px] shrink-0 rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-4 space-y-3">
                  <div className="border-b border-[#EDE4D5] pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                      {isHi ? 'चुना गया राज्य' : 'Selected State'}
                    </span>
                    <h3 className="text-sm font-bold text-[#1F2937]">
                      {getStateDisplayName(chosenState, language)}
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#4B5563] mb-1.5">
                      {isHi ? 'जिला चुनें:' : 'Select District:'}
                    </label>
                    <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                      {stateDistricts.map((d) => {
                        const isSelected = chosenDistrict?.toLowerCase() === d.toLowerCase();
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setChosenDistrict(d)}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition-colors ${
                              isSelected
                                ? 'bg-[#E2725B] text-[#FFFFFF] font-bold shadow-xs'
                                : 'bg-[#FFFFFF] border border-[#EDE4D5] text-[#374151] hover:border-[#D1D5DB] hover:bg-[#F5EFE6]'
                            }`}
                          >
                            <span>{getDistrictDisplayName(d, language)}</span>
                            {isSelected && <Check size={13} className="shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>

      {/* ===================================================================== */}
      {/* 3. FOOTER */}
      {/* ===================================================================== */}
      <footer className="border-t border-[#EDE4D5] bg-[#FAF7F2] px-4 sm:px-8 py-3 text-xs text-[#6B7280]">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <span>{isHi ? '786+ भारतीय जिलों के लिए 100% सटीक कृषि डेटा' : '100% Geodesic Coverage across 786+ Indian Agricultural Districts'}</span>
          <span>© 2026 AgriOptima AI</span>
        </div>
      </footer>
    </div>
  );
}

