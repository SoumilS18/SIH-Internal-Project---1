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
        <Reveal className="flex flex-wrap items-center justify-between gap-5">
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
                  <input
                    type="number"
                    min="0.5"
                    max="100"
                    step="0.5"
                    value={landAcres}
                    onChange={(e) => onLandAcresChange(parseFloat(e.target.value) || 1)}
                    className="field-input py-2.5 text-sm"
                    aria-label={isHi ? 'जमीन का आकार (एकड़)' : 'Land size in acres'}
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {landPresets.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => onLandAcresChange(p.value)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                          landAcres === p.value
                            ? 'bg-[var(--field)] text-white'
                            : 'border border-[var(--line)] bg-[var(--surface-inset)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <StepLabel n="02" icon={IndianRupee}>{isHi ? 'निवेश बजट' : 'Investment budget'}</StepLabel>
                  <input
                    type="number"
                    min="5000"
                    step="5000"
                    value={budgetInr}
                    onChange={(e) => onBudgetInrChange(parseInt(e.target.value, 10) || 50000)}
                    className="field-input py-2.5 text-sm"
                    aria-label={isHi ? 'निवेश बजट रुपये में' : 'Investment budget in rupees'}
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {budgetPresets.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => onBudgetInrChange(p.value)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                          budgetInr === p.value
                            ? 'bg-[var(--field)] text-white'
                            : 'border border-[var(--line)] bg-[var(--surface-inset)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hairline" />

              {/* STEP 03 — irrigation + reliability */}
              <div>
                <StepLabel n="03" icon={Droplets}>{isHi ? 'सिंचाई साधन' : 'Water source'}</StepLabel>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <select
                    value={irrigationType}
                    onChange={(e) => onIrrigationTypeChange(e.target.value as FarmDetailsScreenProps['irrigationType'])}
                    className="field-input py-2.5 text-sm"
                    aria-label={isHi ? 'सिंचाई साधन' : 'Irrigation source'}
                  >
                    <option value="Borewell">{isHi ? 'बोरवेल (Borewell)' : 'Borewell'}</option>
                    <option value="Canal">{isHi ? 'नहर (Canal)' : 'Canal'}</option>
                    <option value="Drip">{isHi ? 'ड्रिप सिंचाई (Drip)' : 'Drip'}</option>
                    <option value="Sprinkler">{isHi ? 'फव्वारा (Sprinkler)' : 'Sprinkler'}</option>
                    <option value="Rainfed">{isHi ? 'वर्षा आधारित (Rainfed)' : 'Rainfed'}</option>
                  </select>
                  <div>
                    <span className="mb-1.5 block text-[11px] font-semibold text-[var(--ink-faint)]">
                      {isHi ? 'जल आपूर्ति की विश्वसनीयता' : 'Water supply reliability'}
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['High', 'Medium', 'Low'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => onIrrigationReliabilityChange(r)}
                          className={`rounded-lg py-2 text-[11px] font-semibold transition-all ${
                            irrigationReliability === r
                              ? 'bg-[var(--sky)] text-white'
                              : 'border border-[var(--line)] bg-[var(--surface-inset)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                          }`}
                        >
                          {translateIrrigationReliability(r, language)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hairline" />

              {/* STEP 04 + 05 — season & risk */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <StepLabel n="04" icon={CalendarDays}>{isHi ? 'फसल मौसम' : 'Crop season'}</StepLabel>
                  <select
                    value={season}
                    onChange={(e) => onSeasonChange(e.target.value as FarmDetailsScreenProps['season'])}
                    className="field-input py-2.5 text-sm"
                    aria-label={isHi ? 'फसल मौसम' : 'Crop season'}
                  >
                    <option value="Kharif">{isHi ? 'खरीफ (Kharif)' : 'Kharif'}</option>
                    <option value="Rabi">{isHi ? 'रबी (Rabi)' : 'Rabi'}</option>
                    <option value="Zaid">{isHi ? 'जायद (Zaid)' : 'Zaid'}</option>
                  </select>
                </div>

                <div>
                  <StepLabel n="05" icon={ShieldCheck}>{isHi ? 'जोखिम क्षमता' : 'Risk appetite'}</StepLabel>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Conservative', 'Balanced', 'Aggressive'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => onRiskToleranceChange(r)}
                        className={`rounded-lg py-2.5 text-[11px] font-semibold transition-all ${
                          riskTolerance === r
                            ? 'bg-[var(--field-deep)] text-white'
                            : 'border border-[var(--line)] bg-[var(--surface-inset)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {r === 'Conservative' ? (isHi ? 'सुरक्षित' : 'Safe') : r === 'Balanced' ? (isHi ? 'संतुलित' : 'Balanced') : (isHi ? 'साहसी' : 'Bold')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* generate CTA */}
              <MagneticButton
                type="submit"
                disabled={loading}
                className="btn btn-primary group mt-1 w-full py-3 text-base disabled:opacity-60"
              >
                <span>
                  {loading
                    ? (isHi ? 'गणना हो रही है…' : 'Calculating…')
                    : (isHi ? 'योजना बनाएं' : 'Generate plan')}
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
