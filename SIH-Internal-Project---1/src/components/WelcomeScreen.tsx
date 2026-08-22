import React, { useMemo, useState } from 'react';
import { IndiaMap } from '@/components/IndiaMap';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { ALL_INDIAN_DISTRICTS } from '@/lib/districtsCatalog';
import { useLanguage } from '@/i18n/LanguageContext';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  User,
  LogOut,
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';

const GOA_IMAGE =
  'https://images.pexels.com/photos/10185531/pexels-photo-10185531.jpeg?auto=compress&cs=tinysrgb&w=1920';

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

const LEAF_PATHS = [
  'M0 0 C 30 -40 70 -50 110 -30 C 80 -20 50 -10 0 0 Z',
  'M0 0 C 40 -55 90 -60 130 -35 C 95 -28 55 -15 0 0 Z',
  'M0 0 C 25 -35 60 -45 95 -28 C 70 -18 40 -8 0 0 Z',
  'M0 0 C 35 -50 85 -55 120 -32 C 88 -24 48 -12 0 0 Z',
];

export function WelcomeScreen({
  userName = 'Demo Farmer',
  onLogout,
  onConfirmLocation,
}: WelcomeScreenProps) {
  const reduced = usePrefersReducedMotion();
  const { t, language } = useLanguage();
  const stars = useMemo(() => STARS, []);
  const particles = useMemo(() => PARTICLES, []);

  const [hovered, setHovered] = useState<string | null>(null);

  // State selection and District modal state
  const [chosenState, setChosenState] = useState<string | null>(null);
  const [chosenDistrict, setChosenDistrict] = useState<string>('');

  // Get districts for chosen state
  const stateDistricts = useMemo(() => {
    if (!chosenState) return [];
    const list = ALL_INDIAN_DISTRICTS.filter(
      (d) => d.state_name.toLowerCase() === chosenState.toLowerCase()
    ).map((d) => d.district_name);
    return Array.from(new Set(list)).sort();
  }, [chosenState]);

  // When a state is clicked on the map
  const handleMapStateSelect = (_code: string, stateName?: string) => {
    if (stateName) {
      setChosenState(stateName);
      // Pick first district of this state as initial default
      const districts = ALL_INDIAN_DISTRICTS.filter(
        (d) => d.state_name.toLowerCase() === stateName.toLowerCase()
      ).map((d) => d.district_name);
      if (districts.length > 0) {
        setChosenDistrict(districts[0]);
      } else {
        setChosenDistrict('');
      }
    }
  };

  // Submit the selected state & district
  const handleProceedToFarm = () => {
    if (!chosenState) return;
    const finalDistrict = chosenDistrict || stateDistricts[0] || 'Center';
    onConfirmLocation(chosenState, finalDistrict);
  };

  return (
    <section
      className="absolute inset-0 h-full w-full overflow-hidden"
      role="region"
      aria-label="Choose a state or language for AgriOptima AI"
    >
      {/* Atmospheric background layers */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src={GOA_IMAGE}
          alt="Agricultural landscape"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ transform: 'scale(1.12)' }}
          loading="eager"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,21,16,0.5)_0%,rgba(4,43,29,0.35)_50%,rgba(2,21,16,0.72)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(2,21,16,0.85)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,21,16,0.35),transparent_45%,rgba(2,21,16,0.4))]" />
        {/* Palm silhouettes */}
        <div
          className="absolute bottom-0 left-0"
          style={{
            transformOrigin: 'bottom left',
            animation: reduced ? undefined : 'sway1 8s ease-in-out infinite',
          }}
        >
          <PalmLeaf variant={0} />
        </div>
        <div
          className="absolute bottom-0 left-[12%]"
          style={{
            transformOrigin: 'bottom left',
            animation: reduced ? undefined : 'sway2 11s ease-in-out 1.5s infinite',
          }}
        >
          <PalmLeaf variant={1} />
        </div>
        <div
          className="absolute bottom-0 right-0"
          style={{
            transformOrigin: 'bottom right',
            animation: reduced ? undefined : 'sway3 14s ease-in-out 0.8s infinite',
          }}
        >
          <PalmLeaf variant={2} flip />
        </div>
      </div>

      {/* Stars and particles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-texture radial-fade opacity-15" />
        {stars.map((star) => (
          <span
            key={star.id}
            className="absolute rounded-full bg-cream-100"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: star.size,
              height: star.size,
              animation: reduced ? undefined : `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
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
              animation: reduced ? undefined : `drift ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Top Header with User Session Strip & Language Selector */}
        <header className="flex shrink-0 items-center justify-between px-5 pt-4 sm:px-10 sm:pt-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-cream-100/90">
              AgriOptima AI · USICT038
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-cream-200/70 sm:inline-block">
              · SIH 2026
            </span>
          </div>

          {/* User Session Chip, Language Selector & Logout */}
          <div className="flex items-center gap-2.5">
            {/* Multilingual Selector */}
            <LanguageSelector />

            <div className="flex items-center gap-1.5 rounded-full border border-gold-300/30 bg-forest-900/70 px-3 py-1 text-xs text-cream-100 backdrop-blur-md">
              <User size={13} className="text-gold-300" />
              <span className="font-medium">{userName}</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 rounded-full border border-forest-700/50 bg-forest-950/60 px-2.5 py-1 text-xs font-mono text-cream-300/70 transition-colors hover:border-pink-500/50 hover:bg-pink-950/40 hover:text-pink-300 focus:outline-none"
              title={t('login.logout')}
            >
              <LogOut size={12} />
              <span className="hidden sm:inline">{t('login.logout')}</span>
            </button>
          </div>
        </header>

        {/* Hero Title */}
        <div className="flex shrink-0 flex-col items-center pt-1 text-center">
          <h1 className="font-serif text-base font-medium text-cream-100 sm:text-lg md:text-xl">
            {t('map.title')}
          </h1>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-cream-300/60 sm:text-[10px]">
            {t('map.subtitle')}
          </p>
        </div>

        {/* Map Area */}
        <div className="relative flex min-h-0 flex-1 items-center justify-center px-1 py-1 sm:px-4 sm:py-1">
          <div className="relative h-full w-full max-w-5xl">
            <IndiaMap
              hovered={hovered as any}
              selected={null}
              onHover={setHovered as any}
              onSelect={handleMapStateSelect as any}
              transitioning={false}
            />
          </div>

          {/* District Selection Overlay Modal */}
          {chosenState && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-forest-950/70 px-4 backdrop-blur-sm transition-all duration-300">
              <div className="w-full max-w-md rounded-2xl border border-gold-300/30 bg-forest-900/90 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-md sm:p-7 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gold-300/15 pb-3">
                  <div className="flex items-center gap-2 text-gold-300">
                    <MapPin size={16} />
                    <span className="font-mono text-[10px] uppercase tracking-wider">
                      {t('map.stateSelected')}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-cream-300/50">
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-300/50 bg-gradient-to-r from-gold-400 to-gold-500 py-3 font-serif text-xs font-semibold text-forest-950 shadow-[0_0_20px_rgba(255,210,26,0.25)] transition-all duration-200 hover:brightness-110 focus:outline-none"
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
        </div>

        {/* Bottom Instruction Bar */}
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 sm:px-10 sm:pb-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-gold-300/55">
            {t('brand.portalHashtag')}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-cream-300/75">
            {t('map.instruction')}
          </span>
        </div>
      </div>
    </section>
  );
}

function PalmLeaf({ variant, flip }: { variant: number; flip?: boolean }) {
  const path = LEAF_PATHS[variant % LEAF_PATHS.length];
  const width = 200 + variant * 30;
  const height = 120 + variant * 20;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 ${-height} ${width} ${height}`}
      fill="none"
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      aria-hidden="true"
    >
      <path d={path} fill="rgba(2,21,16,0.92)" />
    </svg>
  );
}
