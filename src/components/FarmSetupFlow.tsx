import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  MapPin,
  Maximize2,
  IndianRupee,
  Droplets,
  Calendar,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import {
  translateIrrigationType,
  translateIrrigationReliability,
  translateSeason,
} from '@/i18n/enums';
import { formatCurrencyWords, formatArea } from '@/i18n/formatters';
import type { DistrictLocationItem } from '@/types/farm';

interface FarmSetupFlowProps {
  selectedState: string;
  selectedDistrict: string;
  landAcres: number;
  budgetInr: number;
  irrigationType: 'Borewell' | 'Rainfed' | 'Canal' | 'Drip' | 'Sprinkler';
  irrigationReliability: 'High' | 'Medium' | 'Low';
  season: 'Kharif' | 'Rabi' | 'Zaid';
  riskTolerance: 'Conservative' | 'Balanced' | 'Aggressive';
  locations: DistrictLocationItem[];
  loading: boolean;
  onStateChange: (state: string) => void;
  onDistrictChange: (district: string) => void;
  onLandAcresChange: (acres: number) => void;
  onBudgetInrChange: (budget: number) => void;
  onIrrigationTypeChange: (type: 'Borewell' | 'Rainfed' | 'Canal' | 'Drip' | 'Sprinkler') => void;
  onIrrigationReliabilityChange: (reliability: 'High' | 'Medium' | 'Low') => void;
  onSeasonChange: (season: 'Kharif' | 'Rabi' | 'Zaid') => void;
  onRiskToleranceChange: (risk: 'Conservative' | 'Balanced' | 'Aggressive') => void;
  onSubmit: () => void;
}

export function FarmSetupFlow({
  selectedState,
  selectedDistrict,
  landAcres,
  budgetInr,
  irrigationType,
  irrigationReliability,
  season,
  riskTolerance,
  locations,
  loading,
  onStateChange,
  onDistrictChange,
  onLandAcresChange,
  onBudgetInrChange,
  onIrrigationTypeChange,
  onIrrigationReliabilityChange,
  onSeasonChange,
  onRiskToleranceChange,
  onSubmit,
}: FarmSetupFlowProps) {
  const { language, t } = useLanguage();
  const isHi = language === 'hi';

  // Multi-step loading message animation
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = isHi
    ? [
        '1/5 आपके खेत की स्थिति जांची जा रही है...',
        '2/5 लाइव मौसम और 7-दिवसीय पूर्वानुमान देखा जा रहा है...',
        '3/5 मिट्टी की नमी और पानी के साधन का विश्लेषण...',
        '4/5 APMC मंडी भाव और फसल विकल्पों की तुलना...',
        '5/5 आपके खेत के लिए सर्वोत्तम योजना तैयार हो रही है...',
      ]
    : [
        '1/5 Checking your farm conditions...',
        '2/5 Looking at live weather & 7-day forecast...',
        '3/5 Analyzing soil moisture & water availability...',
        '4/5 Comparing crop options & APMC mandi prices...',
        '5/5 Finding your highest-earning optimal plan...',
      ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 700);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading, loadingMessages.length]);

  // Derived state options
  const availableStates = Array.from(new Set(locations.map((l) => l.state_name))).sort();

  const availableDistricts = locations
    .filter((l) => l.state_name.toLowerCase() === selectedState.toLowerCase())
    .map((l) => l.district_name)
    .sort();

  // Quick preset buttons
  const landPresets = [
    { label: isHi ? '1 एकड़' : '1 Ac', value: 1 },
    { label: isHi ? '2 एकड़' : '2 Ac', value: 2 },
    { label: isHi ? '5 एकड़' : '5 Ac', value: 5 },
    { label: isHi ? '10 एकड़' : '10 Ac', value: 10 },
    { label: isHi ? '25 एकड़' : '25 Ac', value: 25 },
  ];

  const budgetPresets = [
    { label: isHi ? '₹50 हज़ार' : '₹50K', value: 50000 },
    { label: isHi ? '₹1 लाख' : '₹1 Lakh', value: 100000 },
    { label: isHi ? '₹2 लाख' : '₹2 Lakh', value: 200000 },
    { label: isHi ? '₹5 लाख' : '₹5 Lakh', value: 500000 },
  ];

  return (
    <div className="rounded-3xl border border-gold-300/30 bg-gradient-to-b from-forest-900/90 to-forest-950/95 p-5 sm:p-6 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      {/* Header */}
      <div className="mb-5 border-b border-gold-300/15 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400/30 to-gold-500/10 text-xl border border-gold-300/30 shadow-inner">
            🌾
          </span>
          <div>
            <h2 className="font-serif text-base sm:text-lg font-bold text-cream-100">
              {t('config.title')}
            </h2>
            <p className="text-xs text-cream-300/70">
              {t('config.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-4 text-xs"
      >
        {/* QUESTION 1: Where is your farm? */}
        <div className="rounded-2xl border border-gold-300/20 bg-forest-950/80 p-4 space-y-2.5 shadow-sm hover:border-gold-300/40 transition-all">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-400/20 text-[10px] font-mono font-bold text-gold-300 border border-gold-300/30">
              1
            </span>
            <MapPin size={14} className="text-gold-300 shrink-0" />
            <label className="text-xs font-bold text-gold-100">
              {t('config.qLocation')}
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <span className="block text-[10px] text-cream-300/60 mb-1 font-medium">
                {t('config.state')}
              </span>
              <select
                value={selectedState}
                onChange={(e) => onStateChange(e.target.value)}
                className="w-full rounded-xl border border-gold-300/30 bg-forest-900/90 px-3 py-2 text-xs text-cream-100 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 focus:outline-none transition-all shadow-inner"
              >
                {availableStates.map((s) => (
                  <option key={s} value={s} className="bg-forest-950 text-cream-100">
                    {getStateDisplayName(s, language)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-[10px] text-cream-300/60 mb-1 font-medium">
                {t('config.district')}
              </span>
              <select
                value={selectedDistrict}
                onChange={(e) => onDistrictChange(e.target.value)}
                className="w-full rounded-xl border border-gold-300/30 bg-forest-900/90 px-3 py-2 text-xs text-cream-100 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 focus:outline-none transition-all shadow-inner"
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d} className="bg-forest-950 text-cream-100">
                    {getDistrictDisplayName(d, language)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* QUESTION 2: How much land do you have? */}
        <div className="rounded-2xl border border-gold-300/20 bg-forest-950/80 p-4 space-y-2.5 shadow-sm hover:border-gold-300/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-400/20 text-[10px] font-mono font-bold text-gold-300 border border-gold-300/30">
                2
              </span>
              <Maximize2 size={14} className="text-gold-300 shrink-0" />
              <label className="text-xs font-bold text-gold-100">
                {t('config.qLand')}
              </label>
            </div>
            <span className="rounded-full bg-gold-400/20 px-2.5 py-0.5 font-mono text-xs font-bold text-gold-300 border border-gold-300/30">
              {formatArea(landAcres, language)}
            </span>
          </div>

          <div className="relative">
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="500"
              value={landAcres}
              onChange={(e) => onLandAcresChange(parseFloat(e.target.value) || 0.5)}
              className="w-full rounded-xl border border-gold-300/30 bg-forest-900/90 px-3 py-2.5 text-xs text-cream-100 pr-14 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 focus:outline-none transition-all font-mono shadow-inner"
            />
            <span className="absolute right-3 top-2.5 text-[11px] text-cream-300/60 font-semibold">
              {isHi ? 'एकड़' : 'Acres'}
            </span>
          </div>

          {/* Quick Land Presets */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {landPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => onLandAcresChange(preset.value)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all ${
                  landAcres === preset.value
                    ? 'bg-gold-400 text-forest-950 font-bold shadow-[0_0_10px_rgba(255,210,26,0.35)] scale-105'
                    : 'border border-gold-300/20 bg-forest-900/80 text-cream-200 hover:border-gold-300/50 hover:bg-forest-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-cream-300/60">{t('config.landHelper')}</p>
        </div>

        {/* QUESTION 3: How much can you spend? */}
        <div className="rounded-2xl border border-gold-300/20 bg-forest-950/80 p-4 space-y-2.5 shadow-sm hover:border-gold-300/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-400/20 text-[10px] font-mono font-bold text-gold-300 border border-gold-300/30">
                3
              </span>
              <IndianRupee size={14} className="text-gold-300 shrink-0" />
              <label className="text-xs font-bold text-gold-100">
                {t('config.qBudget')}
              </label>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-300 border border-emerald-500/30">
              {formatCurrencyWords(budgetInr, language)}
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-gold-300 font-bold">₹</span>
            <input
              type="number"
              step="5000"
              min="5000"
              max="50000000"
              value={budgetInr}
              onChange={(e) => onBudgetInrChange(parseFloat(e.target.value) || 10000)}
              className="w-full rounded-xl border border-gold-300/30 bg-forest-900/90 pl-7 pr-3 py-2.5 text-xs text-cream-100 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 focus:outline-none transition-all font-mono shadow-inner"
            />
          </div>

          {/* Quick Budget Presets */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {budgetPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => onBudgetInrChange(preset.value)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all ${
                  budgetInr === preset.value
                    ? 'bg-gold-400 text-forest-950 font-bold shadow-[0_0_10px_rgba(255,210,26,0.35)] scale-105'
                    : 'border border-gold-300/20 bg-forest-900/80 text-cream-200 hover:border-gold-300/50 hover:bg-forest-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-cream-300/60">{t('config.budgetHelper')}</p>
        </div>

        {/* QUESTION 4: Irrigation Source & Reliability */}
        <div className="rounded-2xl border border-gold-300/20 bg-forest-950/80 p-4 space-y-2.5 shadow-sm hover:border-gold-300/40 transition-all">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-400/20 text-[10px] font-mono font-bold text-gold-300 border border-gold-300/30">
              4
            </span>
            <Droplets size={14} className="text-gold-300 shrink-0" />
            <label className="text-xs font-bold text-gold-100">
              {t('config.qIrrigation')}
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <span className="block text-[10px] text-cream-300/60 mb-1 font-medium">
                {t('config.irrigationType')}
              </span>
              <select
                value={irrigationType}
                onChange={(e) => onIrrigationTypeChange(e.target.value as any)}
                className="w-full rounded-xl border border-gold-300/30 bg-forest-900/90 px-3 py-2 text-xs text-cream-100 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 focus:outline-none transition-all shadow-inner"
              >
                <option value="Borewell">{translateIrrigationType('Borewell', language)}</option>
                <option value="Canal">{translateIrrigationType('Canal', language)}</option>
                <option value="Drip">{translateIrrigationType('Drip', language)}</option>
                <option value="Sprinkler">{translateIrrigationType('Sprinkler', language)}</option>
                <option value="Rainfed">{translateIrrigationType('Rainfed', language)}</option>
              </select>
            </div>

            <div>
              <span className="block text-[10px] text-cream-300/60 mb-1 font-medium">
                {t('config.irrigationReliability')}
              </span>
              <select
                value={irrigationReliability}
                onChange={(e) => onIrrigationReliabilityChange(e.target.value as any)}
                className="w-full rounded-xl border border-gold-300/30 bg-forest-900/90 px-3 py-2 text-xs text-cream-100 focus:border-gold-400 focus:ring-1 focus:ring-gold-400 focus:outline-none transition-all shadow-inner"
              >
                <option value="High">{translateIrrigationReliability('High', language)}</option>
                <option value="Medium">{translateIrrigationReliability('Medium', language)}</option>
                <option value="Low">{translateIrrigationReliability('Low', language)}</option>
              </select>
            </div>
          </div>
          <p className="text-[10px] text-cream-300/60">{t('config.irrigationHelper')}</p>
        </div>

        {/* QUESTION 5: Planting Season */}
        <div className="rounded-2xl border border-gold-300/20 bg-forest-950/80 p-4 space-y-2.5 shadow-sm hover:border-gold-300/40 transition-all">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-400/20 text-[10px] font-mono font-bold text-gold-300 border border-gold-300/30">
              5
            </span>
            <Calendar size={14} className="text-gold-300 shrink-0" />
            <label className="text-xs font-bold text-gold-100">
              {t('config.qSeason')}
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['Kharif', 'Rabi', 'Zaid'] as const).map((s) => {
              const active = season === s;
              const icon = s === 'Kharif' ? '🌧️' : s === 'Rabi' ? '❄️' : '☀️';
              const subtext =
                s === 'Kharif'
                  ? isHi ? 'मानसून' : 'Monsoon'
                  : s === 'Rabi'
                  ? isHi ? 'सर्दियां' : 'Winter'
                  : isHi ? 'गर्मी' : 'Summer';

              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSeasonChange(s)}
                  className={`rounded-xl p-2.5 text-center transition-all duration-200 ${
                    active
                      ? 'border-2 border-gold-400 bg-gold-400/25 text-cream-100 shadow-[0_0_12px_rgba(255,210,26,0.3)] scale-105'
                      : 'border border-gold-300/20 bg-forest-900/80 text-cream-300/80 hover:border-gold-300/40 hover:bg-forest-800'
                  }`}
                >
                  <span className="text-sm block">{icon}</span>
                  <span className="block font-bold text-xs mt-0.5">{translateSeason(s, language)}</span>
                  <span className="block text-[9px] text-cream-300/60 mt-0.5">{subtext}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-cream-300/60">{t('config.seasonHelper')}</p>
        </div>

        {/* QUESTION 6: How much risk are you comfortable taking? */}
        <div className="rounded-2xl border border-gold-300/20 bg-forest-950/80 p-4 space-y-2.5 shadow-sm hover:border-gold-300/40 transition-all">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-400/20 text-[10px] font-mono font-bold text-gold-300 border border-gold-300/30">
              6
            </span>
            <ShieldCheck size={14} className="text-gold-300 shrink-0" />
            <label className="text-xs font-bold text-gold-100">
              {t('config.qRisk')}
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              {
                id: 'Conservative',
                label: t('config.safer'),
                desc: t('config.saferDesc'),
                icon: '🛡️',
              },
              {
                id: 'Balanced',
                label: t('config.balanced'),
                desc: t('config.balancedDesc'),
                icon: '⚖️',
              },
              {
                id: 'Aggressive',
                label: t('config.higherReturn'),
                desc: t('config.higherReturnDesc'),
                icon: '🚀',
              },
            ].map((item) => {
              const active = riskTolerance === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onRiskToleranceChange(item.id as any)}
                  className={`rounded-xl p-2.5 text-center transition-all duration-200 ${
                    active
                      ? 'border-2 border-gold-400 bg-gold-400/25 text-cream-100 shadow-[0_0_12px_rgba(255,210,26,0.3)] scale-105'
                      : 'border border-gold-300/20 bg-forest-900/80 text-cream-300/80 hover:border-gold-300/40 hover:bg-forest-800'
                  }`}
                >
                  <span className="text-base block">{item.icon}</span>
                  <span className="font-bold text-xs block mt-0.5">{item.label}</span>
                  <span className="text-[9px] text-cream-300/60 block mt-0.5 leading-tight">
                    {item.desc}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-cream-300/60">{t('config.riskHelper')}</p>
        </div>

        {/* PRIMARY CTA BUTTON (VISUALLY DOMINANT & GLOWING) */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl border-2 border-gold-300/80 bg-gradient-to-r from-gold-400 via-gold-400 to-gold-500 py-4 font-serif text-sm sm:text-base font-bold text-forest-950 shadow-[0_8px_32px_rgba(255,210,26,0.45)] transition-all hover:brightness-110 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-300/60 disabled:opacity-85"
          >
            {/* Animated shimmer on hover */}
            <div className="pointer-events-none absolute -inset-full top-0 block -skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:animate-shimmer" />

            {loading ? (
              <div className="flex flex-col items-center gap-1.5 text-center py-0.5">
                <div className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin text-forest-950" />
                  <span className="font-bold">{t('config.optimizing')}</span>
                </div>
                {/* Progress bar */}
                <div className="w-48 h-1.5 rounded-full bg-forest-950/20 overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-forest-950 rounded-full transition-all duration-300"
                    style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-forest-950/90 animate-pulse">
                  {loadingMessages[loadingStep]}
                </span>
              </div>
            ) : (
              <>
                <Sparkles size={18} className="text-forest-950 animate-bounce" />
                <span>{t('config.optimizeButton')}</span>
                <ChevronRight size={18} className="text-forest-950/80 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
