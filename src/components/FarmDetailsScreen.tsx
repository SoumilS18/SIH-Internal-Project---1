import React from 'react';
import {
  ArrowRight,
  Sprout,
  IndianRupee,
  Droplets,
  CalendarDays,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { JourneyNav } from '@/components/JourneyNav';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { translateIrrigationReliability } from '@/i18n/enums';
import { FarmDigitalTwin } from '@/components/FarmDigitalTwin';
import { AIAgentOrb } from '@/components/AIAgentOrb';
import { Reveal, MagneticButton } from '@/components/ui/motion';

interface FarmDetailsScreenProps {
  userName?: string;
  selectedState: string;
  selectedDistrict: string;
  landAcres: number;
  budgetInr: number;
  irrigationType: 'Borewell' | 'Rainfed' | 'Canal' | 'Drip' | 'Sprinkler';
  irrigationReliability: 'High' | 'Medium' | 'Low';
  season: 'Kharif' | 'Rabi' | 'Zaid';
  riskTolerance: 'Conservative' | 'Balanced' | 'Aggressive';
  loading?: boolean;
  hasPlan?: boolean;
  onLandAcresChange: (acres: number) => void;
  onBudgetInrChange: (budget: number) => void;
  onIrrigationTypeChange: (type: 'Borewell' | 'Rainfed' | 'Canal' | 'Drip' | 'Sprinkler') => void;
  onIrrigationReliabilityChange: (rel: 'High' | 'Medium' | 'Low') => void;
  onSeasonChange: (season: 'Kharif' | 'Rabi' | 'Zaid') => void;
  onRiskToleranceChange: (risk: 'Conservative' | 'Balanced' | 'Aggressive') => void;
  onGenerate: () => void;
  onChangeLocation: () => void;
  onViewPlan?: () => void;
  onProceedToSentinel?: () => void;
  onLogout?: () => void;
}

/** Guided step eyebrow — turns the setup form into a STEP 01–05 journey. */
function StepLabel({
  n,
  icon: Icon,
  children,
}: {
  n: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="font-data text-xs font-semibold tracking-wider text-[var(--field)]">{n}</span>
      <span className="h-3.5 w-px bg-[var(--line-strong)]" aria-hidden />
      <Icon size={14} className="text-[var(--field)]" />
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
        {children}
      </span>
    </div>
  );
}

/**
 * PAGE 3 — Farm details entry.
 *
 * A dedicated, full-width guided journey where the farmer describes their field
 * (land, budget, water, season, risk). Nothing is computed here: submitting hands
 * off to the cinematic analysis + full-screen plan reveal via onGenerate().
 */
export function FarmDetailsScreen({
  userName,
  selectedState,
  selectedDistrict,
  landAcres,
  budgetInr,
  irrigationType,
  irrigationReliability,
  season,
  riskTolerance,
  loading = false,
  hasPlan = false,
  onLandAcresChange,
  onBudgetInrChange,
  onIrrigationTypeChange,
  onIrrigationReliabilityChange,
  onSeasonChange,
  onRiskToleranceChange,
  onGenerate,
  onChangeLocation,
  onViewPlan,
  onProceedToSentinel,
  onLogout,
}: FarmDetailsScreenProps) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const landPresets = [
    { label: isHi ? '1 एकड़' : '1 Ac', value: 1 },
    { label: isHi ? '2 एकड़' : '2 Ac', value: 2 },
    { label: isHi ? '5 एकड़' : '5 Ac', value: 5 },
    { label: isHi ? '10 एकड़' : '10 Ac', value: 10 },
  ];

  const budgetPresets = [
    { label: isHi ? '₹50 हज़ार' : '₹50K', value: 50000 },
    { label: isHi ? '₹1.2 लाख' : '₹1.2L', value: 120000 },
    { label: isHi ? '₹2 लाख' : '₹2 Lakh', value: 200000 },
    { label: isHi ? '₹5 लाख' : '₹5 Lakh', value: 500000 },
  ];

  const nextSteps = [
    {
      n: '01',
      t: isHi ? 'जमीन व बजट' : 'Land & budget',
      d: isHi ? 'उपलब्ध भूमि और कार्यशील पूंजी।' : 'Your available land and working capital.',
    },
    {
      n: '02',
      t: isHi ? 'सिंचाई व मौसम' : 'Water & season',
      d: isHi ? 'बोरवेल, नहर, ड्रिप या वर्षा आधारित।' : 'Borewell, canal, drip, sprinkler or rainfed.',
    },
    {
      n: '03',
      t: isHi ? 'अनुकूलित AI योजना' : 'Optimized AI plan',
      d: isHi ? 'गणितीय LP इंजन अधिकतम मुनाफ़े हेतु।' : 'A deterministic LP solver maximizes profit.',
    },
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between text-[var(--ink)] selection:bg-[var(--field-tint)] selection:text-[var(--field-deep)]">
      {/* ===================================================================== */}
      {/* 1. FLOATING JOURNEY NAV — brand, growth line, utilities                */}
      {/* ===================================================================== */}
      <JourneyNav
        stage={2}
        userName={userName}
        reachable={hasPlan ? [1, 3, 4] : [1]}
        onNavigate={(target) => {
          if (target === 1) onChangeLocation();
          if (target === 3 && onViewPlan) onViewPlan();
          if (target === 4 && onProceedToSentinel) onProceedToSentinel();
        }}
        onLogout={onLogout}
      />

      {/* ===================================================================== */}
      {/* 2. DETAILS WORKSPACE                                                   */}
      {/* ===================================================================== */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-6 pt-24 sm:px-8 sm:pt-28">
        {/* hero band — the intelligence core invites the farmer to describe the field */}
        <Reveal
          className="relative overflow-hidden rounded-[var(--radius-lg)] p-5 sm:p-7"
          style={{
            background: 'linear-gradient(135deg, rgba(231,241,231,0.88) 0%, rgba(255,255,255,0.94) 55%, rgba(228,238,243,0.80) 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 16px 48px rgb(52 58 44 / 0.08)',
          }}
        >
          {/* atmospheric corner glow */}
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(70,169,104,0.12) 0%, transparent 70%)' }}
            aria-hidden
          />
          <div className="relative flex flex-wrap items-center justify-between gap-5">
            <div className="max-w-2xl">
              <div className="t-eyebrow flex items-center gap-2" style={{ color: 'var(--field)' }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-[var(--field)]" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--field)]" />
                </span>
                {isHi ? 'खेत की जानकारी' : 'Farm setup'}
              </div>
              <h1 className="t-h1 mt-2.5 text-[var(--ink)]">
                {isHi ? 'अपने खेत के बारे में बताएं' : 'Tell me about your farm'}
              </h1>
              <p className="t-lead mt-2 max-w-xl text-[0.95rem]">
                {isHi
                  ? '5 सरल कदम भरें — जमीन, बजट, पानी, मौसम और जोखिम। फिर “योजना बनाएं” दबाएं और AI आपके खेत का पूरा विश्लेषण करेगा।'
                  : 'Fill five simple steps — land, budget, water, season and risk. Then tap “Generate plan” and the AI will analyze your exact field.'}
              </p>
            </div>
            <div className="shrink-0">
              <AIAgentOrb state="listening" size={104} />
            </div>
          </div>
        </Reveal>

        {/* body — guided form (left) + location & living-twin context (right) */}
        <div className="mt-7 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* =============================================================== */}
          {/* LEFT — the guided STEP 01–05 form                               */}
          {/* =============================================================== */}
          <Reveal className="lg:col-span-7" delay={60}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onGenerate();
              }}
              className="panel space-y-6 p-6 sm:p-7"
            >
              {/* STEP 01 + 02 — land & budget */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <StepLabel n="01" icon={Sprout}>{isHi ? 'जमीन का आकार' : 'Land size'}</StepLabel>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0.5"
                      max="100"
                      step="0.5"
                      value={landAcres}
                      onChange={(e) => onLandAcresChange(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                      className="field-input py-2.5 text-sm font-semibold font-data w-32"
                      aria-label={isHi ? 'जमीन का आकार (एकड़)' : 'Land size in acres'}
                    />
                    <span className="text-xs font-semibold text-[var(--ink-soft)]">
                      {isHi ? 'एकड़' : 'Acres'}
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {landPresets.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => onLandAcresChange(p.value)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                          landAcres === p.value
                            ? 'bg-[var(--field)] text-white shadow-sm ring-2 ring-[var(--field)]/20'
                            : 'border border-[var(--line)] bg-[var(--surface-inset)] text-[var(--ink-soft)] hover:border-[var(--field)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <StepLabel n="02" icon={IndianRupee}>{isHi ? 'निवेश बजट' : 'Investment budget'}</StepLabel>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="5000"
                      step="5000"
                      value={budgetInr}
                      onChange={(e) => onBudgetInrChange(Math.max(5000, parseInt(e.target.value, 10) || 50000))}
                      className="field-input py-2.5 text-sm font-semibold font-data w-36"
                      aria-label={isHi ? 'निवेश बजट रुपये में' : 'Investment budget in rupees'}
                    />
                    <span className="text-xs font-semibold text-[var(--ink-soft)]">
                      ₹{Math.round(budgetInr).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {budgetPresets.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => onBudgetInrChange(p.value)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                          budgetInr === p.value
                            ? 'bg-[var(--field)] text-white shadow-sm ring-2 ring-[var(--field)]/20'
                            : 'border border-[var(--line)] bg-[var(--surface-inset)] text-[var(--ink-soft)] hover:border-[var(--field)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hairline" />

              {/* STEP 03 — visual water source + reliability */}
              <div>
                <StepLabel n="03" icon={Droplets}>{isHi ? 'सिंचाई साधन व विश्वसनीयता' : 'Water source & reliability'}</StepLabel>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {[
                    { id: 'Borewell', en: 'Borewell', hi: 'बोरवेल', icon: '🚰' },
                    { id: 'Canal', en: 'Canal', hi: 'नहर', icon: '🌊' },
                    { id: 'Drip', en: 'Drip', hi: 'ड्रिप', icon: '💧' },
                    { id: 'Sprinkler', en: 'Sprinkler', hi: 'फव्वारा', icon: '🌦️' },
                    { id: 'Rainfed', en: 'Rainfed', hi: 'वर्षा आधारित', icon: '🌧️' },
                  ].map((src) => {
                    const isSel = irrigationType === src.id;
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => onIrrigationTypeChange(src.id as any)}
                        className={`flex flex-col items-center justify-center gap-1 rounded-2xl p-2.5 text-center transition-all ${
                          isSel
                            ? 'bg-[var(--sky-tint)] text-[var(--ink)] ring-2 ring-[var(--sky)] shadow-sm'
                            : 'border border-[var(--line)] bg-[var(--surface-inset)] text-[var(--ink-soft)] hover:border-[var(--sky)] hover:text-[var(--ink)]'
                        }`}
                      >
                        <span className="text-lg">{src.icon}</span>
                        <span className="text-xs font-semibold leading-tight">
                          {isHi ? src.hi : src.en}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-inset)] p-3">
                  <span className="text-xs font-semibold text-[var(--ink-soft)]">
                    {isHi ? 'जल उपलब्धता विश्वसनीयता:' : 'Water availability reliability:'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(['High', 'Medium', 'Low'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => onIrrigationReliabilityChange(r)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                          irrigationReliability === r
                            ? 'bg-[var(--sky)] text-white shadow-xs'
                            : 'border border-[var(--line)] bg-[var(--surface-solid)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {translateIrrigationReliability(r, language)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hairline" />

              {/* STEP 04 — visual crop season selection */}
              <div>
                <StepLabel n="04" icon={CalendarDays}>{isHi ? 'फसल मौसम' : 'Crop season'}</StepLabel>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {[
                    { id: 'Kharif', en: 'Kharif (Monsoon)', hi: 'खरीफ (मानसून)', subEn: 'Rice, Cotton, Maize, Pulses', subHi: 'धान, कपास, मक्का, दालें', icon: '🌧️' },
                    { id: 'Rabi', en: 'Rabi (Winter)', hi: 'रबी (सर्दी)', subEn: 'Wheat, Mustard, Gram, Potato', subHi: 'गेहूं, सरसों, चना, आलू', icon: '🌾' },
                    { id: 'Zaid', en: 'Zaid (Summer)', hi: 'जायद (गर्मी)', subEn: 'Vegetables, Cash crops, Melons', subHi: 'सब्जियां, तरबूज, उड़द/मूंग', icon: '☀️' },
                  ].map((seas) => {
                    const isSel = season === seas.id;
                    return (
                      <button
                        key={seas.id}
                        type="button"
                        onClick={() => onSeasonChange(seas.id as any)}
                        className={`flex flex-col items-start gap-1 rounded-2xl p-3.5 text-left transition-all ${
                          isSel
                            ? 'bg-[var(--field-tint)] text-[var(--field-deep)] ring-2 ring-[var(--field)] shadow-sm'
                            : 'border border-[var(--line)] bg-[var(--surface-inset)] text-[var(--ink)] hover:border-[var(--field)]'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="text-base">{seas.icon}</span>
                          <span className={`h-2 w-2 rounded-full ${isSel ? 'bg-[var(--field)]' : 'bg-transparent'}`} />
                        </div>
                        <span className="mt-1 text-xs font-bold">
                          {isHi ? seas.hi : seas.en}
                        </span>
                        <span className="text-[10px] leading-tight text-[var(--ink-soft)]">
                          {isHi ? seas.subHi : seas.subEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="hairline" />

              {/* STEP 05 — visual risk appetite */}
              <div>
                <StepLabel n="05" icon={ShieldCheck}>{isHi ? 'जोखिम प्रबंधन व रणनीति' : 'Risk appetite & strategy'}</StepLabel>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {[
                    { id: 'Conservative', en: 'Safe / Conservative', hi: 'सुरक्षित (कम जोखिम)', subEn: 'Guaranteed staple yields', subHi: 'न्यूनतम जोखिम, पक्की उपज' },
                    { id: 'Balanced', en: 'Balanced / Optimal', hi: 'संतुलित (सुझावित)', subEn: 'Best profit vs stability', subHi: 'अधिकतम लाभ व स्थिरता' },
                    { id: 'Aggressive', en: 'Bold / High Growth', hi: 'साहसी (उच्च लाभ)', subEn: 'High cash crops reward', subHi: 'उच्च बाजार लाभ अवसर' },
                  ].map((r) => {
                    const isSel = riskTolerance === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onRiskToleranceChange(r.id as any)}
                        className={`flex flex-col items-start gap-1 rounded-2xl p-3.5 text-left transition-all ${
                          isSel
                            ? 'bg-[var(--grain-tint)] text-[var(--grain-deep)] ring-2 ring-[var(--grain)] shadow-sm'
                            : 'border border-[var(--line)] bg-[var(--surface-inset)] text-[var(--ink)] hover:border-[var(--grain)]'
                        }`}
                      >
                        <span className="text-xs font-bold">
                          {isHi ? r.hi : r.en}
                        </span>
                        <span className="text-[10px] leading-tight text-[var(--ink-soft)]">
                          {isHi ? r.subHi : r.subEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* generate CTA */}
              <MagneticButton
                type="submit"
                disabled={loading}
                className="btn btn-primary group mt-2 w-full py-3.5 text-base font-semibold shadow-md disabled:opacity-60"
              >
                <span>
                  {loading
                    ? (isHi ? 'खेत का विश्लेषण हो रहा है…' : 'Analyzing farm parameters…')
                    : (isHi ? 'अनुकूलित योजना बनाएं' : 'Generate optimized plan')}
                </span>
                {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
              </MagneticButton>
            </form>
          </Reveal>

          {/* =============================================================== */}
          {/* RIGHT — location + living twin + what happens next              */}
          {/* =============================================================== */}
          <Reveal className="space-y-5 lg:col-span-5" delay={120}>
            {/* location */}
            <div className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface-inset)] p-4">
              <div className="flex items-center gap-2.5">
                <MapPin size={16} className="shrink-0 text-[var(--grain-deep)]" />
                <div>
                  <span className="t-eyebrow block text-[0.55rem]">
                    {isHi ? 'खेत का स्थान' : 'Farm location'}
                  </span>
                  <span className="text-sm font-semibold text-[var(--ink)]">
                    {getDistrictDisplayName(selectedDistrict, language)}, {getStateDisplayName(selectedState, language)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onChangeLocation}
                className="text-xs font-semibold text-[var(--field-deep)] hover:underline"
              >
                {isHi ? 'बदलें' : 'Change'}
              </button>
            </div>

            {/* living demo twin — the object that carries through the whole flow */}
            <div className="panel-elevated overflow-hidden p-4">
              <div className="relative">
                <FarmDigitalTwin height={300} interactive showWeather className="w-full" />
                <span className="t-eyebrow absolute bottom-1 left-1 text-[var(--ink-ghost)]">
                  {isHi ? 'लाइव डिजिटल फार्म ट्विन · पूर्वावलोकन' : 'Live digital farm twin · preview'}
                </span>
              </div>
            </div>

            {/* what happens next */}
            <div className="rounded-2xl border border-[var(--line)] p-5">
              <span className="t-eyebrow">{isHi ? 'आगे क्या होगा' : 'What happens next'}</span>
              <div className="mt-3 space-y-3">
                {nextSteps.map((s) => (
                  <div key={s.n} className="flex items-start gap-3">
                    <span className="font-data text-sm font-semibold text-[var(--field)]">{s.n}</span>
                    <div>
                      <div className="text-sm font-semibold text-[var(--ink)]">{s.t}</div>
                      <p className="mt-0.5 text-[11px] leading-snug text-[var(--ink-soft)]">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </main>

      {/* ===================================================================== */}
      {/* 3. FOOTER                                                              */}
      {/* ===================================================================== */}
      <footer className="border-t border-[var(--line-soft)] px-4 pb-24 pt-3 text-xs text-[var(--ink-soft)] sm:px-8 md:pb-3">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-[11px]">
          <span>{isHi ? 'ICAR कृषि इंजन एवं रीयल-टाइम मंडी डेटा द्वारा संचालित' : 'Powered by ICAR Agronomy Engine & Real-time Mandi Telemetry'}</span>
          <span>© 2026 AgriOptima AI</span>
        </div>
      </footer>
    </div>
  );
}
