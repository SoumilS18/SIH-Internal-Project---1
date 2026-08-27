import React, { useState } from 'react';
import {
  ArrowRight,
  Layers,
  Pencil,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { JourneyNav } from '@/components/JourneyNav';
import { getCropDisplayName } from '@/i18n/cropNames';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { formatCurrency, formatCurrencyWords } from '@/i18n/formatters';
import {
  translateRiskLevel,
  translateSeason,
} from '@/i18n/enums';
import { DetailedAnalysisView } from '@/components/DetailedAnalysisView';
import { FarmDigitalTwin } from '@/components/FarmDigitalTwin';
import { AIAgentOrb } from '@/components/AIAgentOrb';
import { StatBlock, ProgressRing, AllocationBar, RiskMeter, DonutChart } from '@/components/ui/dataviz';
import { Reveal, MagneticButton, Counter } from '@/components/ui/motion';
import { usePrefersReducedMotion } from '@/lib/hooks';
import type { FarmDecisionResponse } from '@/types/farm';

interface FarmPlanScreenProps {
  userName?: string;
  selectedState: string;
  selectedDistrict: string;
  landAcres: number;
  budgetInr: number;
  season: 'Kharif' | 'Rabi' | 'Zaid';
  decision: FarmDecisionResponse | null;
  loading: boolean;
  onEditDetails: () => void;
  onChangeLocation: () => void;
  onProceedToSentinel: () => void;
  onLogout: () => void;
}

// Crop icon mapper for friendly visual representation
function getCropIcon(cropName: string): string {
  const c = cropName.toLowerCase();
  if (c.includes('sugarcane') || c.includes('गन्ना')) return '🎋';
  if (c.includes('rice') || c.includes('paddy') || c.includes('चावल') || c.includes('धान')) return '🌾';
  if (c.includes('wheat') || c.includes('गेहूँ')) return '🌾';
  if (c.includes('maize') || c.includes('corn') || c.includes('मक्का')) return '🌽';
  if (c.includes('cotton') || c.includes('कपास')) return '☁️';
  if (c.includes('soyabean') || c.includes('soybean') || c.includes('सोयाबीन')) return '🫘';
  if (c.includes('pigeonpea') || c.includes('arhar') || c.includes('tur') || c.includes('अरहर')) return '🌿';
  if (c.includes('gram') || c.includes('chana') || c.includes('चना')) return '🌱';
  if (c.includes('mustard') || c.includes('सरसों')) return '🌼';
  if (c.includes('groundnut') || c.includes('peanut') || c.includes('मूंगफली')) return '🥜';
  if (c.includes('potato') || c.includes('आलू')) return '🥔';
  if (c.includes('onion') || c.includes('प्याज')) return '🧅';
  if (c.includes('tomato') || c.includes('टमाटर')) return '🍅';
  if (c.includes('sunflower') || c.includes('सूरजमुखी')) return '🌻';
  if (c.includes('mung') || c.includes('moong') || c.includes('मूंग')) return '🌱';
  if (c.includes('urad') || c.includes('उड़द')) return '🌿';
  return '🌱';
}

// palette for allocation segments (theme-aware tokens, matches the twin's language)
const ALLOC_COLORS = [
  'var(--field)',
  'var(--grain)',
  'var(--sky)',
  'var(--field-deep)',
  'var(--soil)',
  'var(--grain-deep)',
];

export function FarmPlanScreen({
  userName,
  selectedState,
  selectedDistrict,
  landAcres,
  budgetInr,
  season,
  decision,
  loading,
  onEditDetails,
  onChangeLocation,
  onProceedToSentinel,
  onLogout,
}: FarmPlanScreenProps) {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const reduced = usePrefersReducedMotion();

  const [showDetailedModal, setShowDetailedModal] = useState<boolean>(false);
  const [showFull7DayModal, setShowFull7DayModal] = useState<boolean>(false);
  const [activeCrop, setActiveCrop] = useState<string | null>(null);

  // Derived decision values
  const allocatedCrops = decision?.allocated_crops || [];
  const farmTotals = decision?.farm_totals;
  const netProfit = farmTotals?.total_expected_net_profit_inr ?? 0;
  const totalInvestment = farmTotals?.total_investment_inr ?? budgetInr;
  const roiPct = farmTotals?.expected_farm_roi_pct ?? 0;
  const riskLabel = farmTotals?.weighted_risk_label?.toUpperCase() || 'LOW';
  // Parse fill strength from the RAW English risk so the meter stays correct even when the label is shown in Hindi.
  const riskLevelNum: 1 | 2 | 3 | 4 = riskLabel.includes('CRIT')
    ? 4
    : riskLabel.includes('HIGH')
      ? 3
      : riskLabel.includes('MOD')
        ? 2
        : 1;

  const allocSegments = allocatedCrops.map((c, i) => ({
    name: getCropDisplayName(c.crop_name, language),
    share: c.acre_share_pct,
    color: ALLOC_COLORS[i % ALLOC_COLORS.length],
  }));

  // Estimated cost breakdown — the backend returns a single total_investment_inr with no
  // category split, so we model a realistic Labor/Fertilizer/Other/Seeds/Irrigation spread
  // over the REAL total and surface it as "Estimated". Percentages sum to 1.00.
  const COST_MODEL: Array<{ key: string; label: string; pct: number; color: string }> = [
    { key: 'labor', label: isHi ? 'मज़दूरी' : 'Labor', pct: 0.26, color: 'var(--field-deep)' },
    { key: 'fertilizer', label: isHi ? 'खाद' : 'Fertilizer', pct: 0.22, color: 'var(--field)' },
    { key: 'other', label: isHi ? 'अन्य लागत' : 'Other inputs', pct: 0.22, color: 'var(--soil)' },
    { key: 'seeds', label: isHi ? 'बीज' : 'Seeds', pct: 0.18, color: 'var(--grain)' },
    { key: 'irrigation', label: isHi ? 'सिंचाई' : 'Irrigation', pct: 0.12, color: 'var(--sky)' },
  ];
  const costSegments = COST_MODEL.map((c) => ({
    name: c.label,
    value: Math.round(totalInvestment * c.pct),
    pct: c.pct,
    color: c.color,
  }));

  // Remount key so the plan-reveal entrance animations replay whenever a new/recalculated plan lands.
  const planKey = decision
    ? `${allocatedCrops.map((c) => c.crop_name).join('-')}|${Math.round(netProfit)}|${Math.round(totalInvestment)}`
    : 'none';
  const cropLine =
    allocatedCrops.length > 0
      ? `${isHi ? 'उगाएं ' : 'Grow '}${allocatedCrops.map((c) => getCropDisplayName(c.crop_name, language)).join(' + ')}`
      : isHi
        ? 'अनुकूलित फसल योजना'
        : 'Optimized crop plan';

  // 7-day micro-plan summary days
  const default7Days = [
    { day: 1, title: isHi ? 'खेत की जुताई' : 'Land Prep', desc: isHi ? 'खेत की गहरी जुताई व पाटा लगाना' : 'Deep ploughing & seedbed preparation' },
    { day: 2, title: isHi ? 'बीजोपचार' : 'Seed Treatment', desc: isHi ? 'प्रमाणित बीज व ट्राइकोडर्मा बीजोपचार' : 'Certified seed & bio-fungicide treatment' },
    { day: 3, title: isHi ? 'बुवाई / रोपाई' : 'Sowing', desc: isHi ? 'नमी अनुसार कतारबद्ध बुवाई' : 'Line sowing aligned with soil moisture' },
    { day: 4, title: isHi ? 'सिंचाई जांच' : 'Irrigation', desc: isHi ? 'हल्की नमी जांच व जल निकासी' : 'Moisture check & drip/drainage check' },
    { day: 5, title: isHi ? 'आधार खाद' : 'Fertilizer 1', desc: isHi ? 'संतुलित डीएपी/एनपीके आधार खुराक' : 'Basal DAP/NPK balanced dosage' },
    { day: 6, title: isHi ? 'खरपतवार नियंत्रण' : 'Weed Control', desc: isHi ? 'निराई-गुड़ाई व खेत की सफाई' : 'Manual weeding & inter-culture' },
    { day: 7, title: isHi ? 'फसल निरीक्षण' : 'Field Check', desc: isHi ? 'अंकुरण प्रतिशत व कीट जांच' : 'Germination percentage & health check' },
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between text-[var(--ink)] selection:bg-[var(--grain-tint)] selection:text-[var(--grain-deep)]">
      {/* ===================================================================== */}
      {/* 1. FLOATING JOURNEY NAV — the growth line is gold once a plan exists   */}
      {/* ===================================================================== */}
      <JourneyNav
        stage={3}
        accent="grain"
        userName={userName}
        reachable={[1, 2]}
        onNavigate={(target) => {
          if (target === 1) onChangeLocation();
          if (target === 2) onEditDetails();
        }}
        onLogout={onLogout}
        actions={
          <>
            <button
              type="button"
              onClick={onEditDetails}
              className="nav-pill hidden h-9 items-center gap-1.5 px-3 text-xs font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] sm:inline-flex"
              title={isHi ? 'विवरण बदलें' : 'Edit details'}
            >
              <Pencil size={13} className="text-[var(--grain-deep)]" />
              <span className="hidden sm:inline">{isHi ? 'विवरण बदलें' : 'Edit details'}</span>
            </button>
            {decision && (
              <button
                type="button"
                onClick={() => setShowDetailedModal(true)}
                className="nav-pill hidden h-9 items-center gap-1.5 px-3 text-xs font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] lg:inline-flex"
              >
                <Layers size={14} className="text-[var(--grain-deep)]" />
                <span>{isHi ? 'विस्तृत विश्लेषण' : 'Detailed Analysis'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onProceedToSentinel}
              className="btn btn-primary btn-sm"
            >
              <span>{isHi ? 'सेंटीनेल' : 'Sentinel'}</span>
              <ArrowRight size={13} />
            </button>
          </>
        }
      />

      {/* ===================================================================== */}
      {/* 2. MAIN WORKSPACE                                                      */}
      {/* ===================================================================== */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-24 sm:px-8 sm:pt-28 md:pb-8">
        {!decision ? (
          /* ---------- DEFENSIVE: plan still finalizing ---------- */
          <div className="grid min-h-[60vh] place-items-center">
            <div className="flex max-w-md flex-col items-center gap-4 text-center">
              <AIAgentOrb state="analyzing" size={120} />
              <div>
                <h2 className="t-h3 text-[var(--ink)]">
                  {isHi ? 'आपकी योजना तैयार की जा रही है…' : 'Finalizing your plan…'}
                </h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  {isHi ? 'कृपया एक क्षण प्रतीक्षा करें।' : 'This will only take a moment.'}
                </p>
              </div>
              <button type="button" onClick={onEditDetails} className="btn-ghost text-sm">
                {isHi ? '← विवरण पर लौटें' : '← Back to details'}
              </button>
            </div>
          </div>
        ) : (
          /* ---------- PLAN REVEAL (full width) ---------- */
          <div className="space-y-6" key={planKey}>
                {/* PLAN SURFACE — headline on top, twin + cost parallel, stats below both */}
                <Reveal className="panel-elevated overflow-hidden p-6 sm:p-7">
                  {/* headline — large brand-gradient block heading with a reveal wipe */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-2xl">
                      <div className="t-eyebrow flex items-center gap-2" style={{ color: 'var(--field)' }}>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-[var(--field)]" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--field)]" />
                        </span>
                        {isHi ? `सर्वोत्तम योजना · ${translateSeason(season, language)} 2026` : `Recommended plan · ${translateSeason(season, language)} 2026`}
                      </div>
                      <h2 className="plan-title animate-plan-title mt-3">{cropLine}</h2>
                      <p className="animate-plan-sub mt-3 text-[0.95rem] font-medium text-[var(--ink-soft)]">
                        {landAcres} {isHi ? 'एकड़' : 'acres'} · {getDistrictDisplayName(selectedDistrict, language)}, {getStateDisplayName(selectedState, language)}
                      </p>
                    </div>
                    <span className="chip chip-field shrink-0 text-[11px]">
                      <CheckCircle2 size={13} />
                      {isHi ? 'विश्वसनीयता: उच्च' : 'Confidence: High'}
                    </span>
                  </div>

                  {/* TWIN + COST — the field and where the money goes, side by side */}
                  <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-0">
                    <div className="flex flex-col justify-center lg:col-span-3 lg:pr-7">
                      {/* twin centerpiece — now showing the REAL allocation */}
                      <div className="relative">
                        <FarmDigitalTwin
                          decision={decision}
                          height={380}
                          interactive
                          showWeather
                          scanning={loading}
                          selectedCrop={activeCrop}
                          onSelectCrop={setActiveCrop}
                          className="w-full"
                        />
                        <span className="t-eyebrow absolute bottom-1 left-1 text-[var(--ink-ghost)]">
                          {isHi ? 'आपका डिजिटल फार्म ट्विन' : 'Your digital farm twin'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col border-t border-[var(--line)] pt-5 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="t-h3 text-[1.05rem] text-[var(--ink)]">
                            {isHi ? 'आपका पैसा कहाँ लगेगा' : 'Where your money goes'}
                          </h3>
                          <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
                            {isHi ? 'अनुमानित कुल लागत' : 'Estimated total cost'} ·{' '}
                            <span className="font-data font-semibold text-[var(--ink)]">
                              ₹{Math.round(totalInvestment).toLocaleString('en-IN')}
                            </span>
                          </p>
                        </div>
                        <span className="chip chip-grain shrink-0 text-[10px]">{isHi ? 'अनुमानित' : 'Estimated'}</span>
                      </div>
                      <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-6">
                        <DonutChart
                          segments={costSegments}
                          size={210}
                          thickness={26}
                          className="shrink-0"
                          centerTop={<Counter value={Math.round(totalInvestment)} prefix="₹" />}
                          centerBottom={isHi ? 'कुल लागत' : 'Total cost'}
                        />
                        <div className="grid w-full grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                          {costSegments.map((s) => (
                            <div
                              key={s.name}
                              className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2"
                            >
                              <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-soft)]">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                                {s.name}
                              </span>
                              <span className="font-data text-sm font-semibold text-[var(--ink)]">
                                {Math.round(s.pct * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* animated stats — open, hairline-divided (no inner cards) */}
                  <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-[var(--line)] pt-6 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-[var(--line)]">
                    <StatBlock
                      label={isHi ? 'कुल अनुमानित लाभ' : 'Expected profit'}
                      value={netProfit}
                      prefix="₹"
                      compactINR
                      tone="field"
                      className="lg:pr-4"
                      sub={formatCurrencyWords(netProfit, language)}
                    />
                    <div className="grid place-items-center lg:px-2">
                      <ProgressRing
                        value={Math.max(0, Math.min(100, roiPct))}
                        size={116}
                        stroke={9}
                        tone="grain"
                        centerTop={<Counter value={roiPct} decimals={0} prefix="+" suffix="%" />}
                        centerBottom={isHi ? 'रिटर्न' : 'ROI'}
                      />
                    </div>
                    <StatBlock
                      label={isHi ? 'कुल निवेश' : 'Total investment'}
                      value={totalInvestment}
                      prefix="₹"
                      compactINR
                      tone="sky"
                      className="lg:px-4"
                      sub={formatCurrencyWords(totalInvestment, language)}
                    />
                    <div className="lg:pl-4">
                      <div className="t-eyebrow mb-2">{isHi ? 'जोखिम स्तर' : 'Risk level'}</div>
                      <RiskMeter
                        label={translateRiskLevel(riskLabel, language)}
                        level={riskLevelNum}
                        caption={`${allocatedCrops.length} ${isHi ? 'फसलें' : 'crops'}`}
                      />
                    </div>
                  </div>

                  {/* allocation bar + legend */}
                  <div className="mt-6 border-t border-[var(--line)] pt-5">
                    <div className="t-eyebrow mb-2.5">{isHi ? 'फसल आवंटन' : 'Crop allocation'}</div>
                    <AllocationBar segments={allocSegments} />
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                      {allocSegments.map((s) => (
                        <span key={s.name} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-soft)]">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                          {s.name} · {s.share.toFixed(0)}%
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>

                {/* CROP DETAIL — clean hairline rows (not a 3-col card grid) */}
                <Reveal className="panel p-5 sm:p-6" delay={60}>
                  <h3 className="t-h3 text-[1.05rem] text-[var(--ink)]">
                    {isHi ? 'फसलें, रकबा और अनुमानित लाभ' : 'Crops, acreage & expected profit'}
                  </h3>
                  <div className="mt-3 divide-y divide-[var(--line)]">
                    {allocatedCrops.map((crop, idx) => {
                      const share = crop.acre_share_pct;
                      const isActive = activeCrop === crop.crop_name;
                      return (
                        <button
                          type="button"
                          key={idx}
                          onMouseEnter={() => setActiveCrop(crop.crop_name)}
                          onFocus={() => setActiveCrop(crop.crop_name)}
                          onMouseLeave={() => setActiveCrop(null)}
                          onBlur={() => setActiveCrop(null)}
                          className={`flex w-full items-center gap-4 py-3.5 text-left transition-colors ${isActive ? 'bg-[var(--surface-inset)]' : ''}`}
                        >
                          <span
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl leaf-radius"
                            style={{ background: 'var(--field-tint)' }}
                          >
                            {getCropIcon(crop.crop_name)}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="truncate font-display text-sm font-semibold text-[var(--ink)]">
                                {getCropDisplayName(crop.crop_name, language)}
                              </span>
                              <span className="shrink-0 font-data text-[11px] text-[var(--ink-faint)]">
                                {crop.allocated_acres.toFixed(1)} {isHi ? 'एकड़' : 'ac'} · {share.toFixed(0)}%
                              </span>
                            </div>
                            {/* per-crop share track */}
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-inset)]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.max(4, Math.min(100, share))}%`,
                                  background: ALLOC_COLORS[idx % ALLOC_COLORS.length],
                                  transition: reduced ? undefined : 'width 1s var(--ease-out)',
                                }}
                              />
                            </div>
                          </div>

                          <div className="hidden shrink-0 text-right sm:block">
                            <span className="t-eyebrow block text-[0.5rem]">{isHi ? 'लाभ' : 'Profit'}</span>
                            <span className="font-display text-sm font-semibold text-[var(--field-deep)]">
                              {formatCurrency(crop.net_profit_inr, language)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Reveal>

                {/* 7-DAY — connected horizontal timeline */}
                <Reveal className="panel p-5 sm:p-6" delay={90}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="t-h3 text-[1.05rem] text-[var(--ink)]">
                        {isHi ? '7-दिवसीय कार्ययोजना' : '7-day action plan'}
                      </h3>
                      <p className="text-[11px] text-[var(--ink-soft)]">
                        {isHi ? 'इस सप्ताह आपके खेत के लिए' : 'For your farm, this week'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFull7DayModal(true)}
                      className="text-xs font-semibold text-[var(--grain-deep)] transition-colors hover:text-[var(--field)]"
                    >
                      {isHi ? 'पूरी योजना →' : 'Full plan →'}
                    </button>
                  </div>

                  <div className="mt-4 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {default7Days.map((step, i) => (
                      <div key={step.day} className="relative flex min-w-[124px] flex-1 flex-col">
                        {/* connector line */}
                        {i < default7Days.length - 1 && (
                          <span className="absolute left-[26px] top-[10px] hidden h-px w-full bg-[var(--line)] sm:block" aria-hidden />
                        )}
                        <div className="flex items-center gap-2">
                          <span className="z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--field)] font-data text-[9px] font-semibold text-white">
                            {step.day}
                          </span>
                          <span className="t-eyebrow text-[0.5rem]">{isHi ? `दिन ${step.day}` : `Day ${step.day}`}</span>
                        </div>
                        <h4 className="mt-2 text-xs font-semibold text-[var(--ink)]">{step.title}</h4>
                        <p className="mt-0.5 text-[10px] leading-tight text-[var(--ink-soft)]">{step.desc}</p>
                      </div>
                    ))}
                  </div>
                </Reveal>

                {/* DEEPER — the full scientific & mathematical breakdown */}
                <Reveal className="flex justify-end" delay={120}>
                  <button
                    type="button"
                    onClick={() => setShowDetailedModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--grain-deep)] transition-colors hover:text-[var(--field)]"
                  >
                    {isHi ? 'वैज्ञानिक व गणितीय विश्लेषण देखें →' : 'See the scientific & mathematical analysis →'}
                  </button>
                </Reveal>

                {/* SENTINEL CTA — de-boxed gradient banner with the intelligence core */}
                <Reveal
                  className="relative flex flex-col items-center justify-between gap-4 overflow-hidden rounded-3xl border border-[var(--grain-tint)] p-5 sm:flex-row sm:p-6"
                  delay={150}
                  style={{ background: 'linear-gradient(100deg, var(--grain-tint), var(--surface))' }}
                >
                  <div className="flex items-center gap-4">
                    <AIAgentOrb state="idle" size={52} />
                    <div>
                      <h3 className="t-h3 text-[1.05rem] text-[var(--ink)]">
                        {isHi ? 'स्वायत्त सेंटीनेल सक्रिय करें' : 'Activate the autonomous Sentinel'}
                      </h3>
                      <p className="mt-0.5 max-w-lg text-xs text-[var(--ink-soft)]">
                        {isHi
                          ? 'योजना बनने के बाद सेंटीनेल मौसम, फसल तनाव और मंडी भाव की 24/7 निगरानी करता है।'
                          : 'Once the plan is set, Sentinel watches weather, crop stress and mandi prices 24/7.'}
                      </p>
                    </div>
                  </div>

                  <MagneticButton
                    type="button"
                    onClick={onProceedToSentinel}
                    className="btn btn-primary group shrink-0 text-sm"
                  >
                    <span>{isHi ? 'सेंटीनेल चालू करें' : 'Proceed to Sentinel'}</span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </MagneticButton>
                </Reveal>
              </div>
            )}
      </main>

      {/* ===================================================================== */}
      {/* 3. FULL 7-DAY ACTION PLAN MODAL                                        */}
      {/* ===================================================================== */}
      {showFull7DayModal && (
        <div className="scrim fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="panel-modal max-h-[85vh] w-full max-w-2xl space-y-4 overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
                  {isHi ? 'विस्तृत 7-दिवसीय खेत कार्ययोजना' : 'Comprehensive 7-Day Farm Action Plan'}
                </h3>
                <p className="text-xs text-[var(--ink-soft)]">
                  {isHi ? 'आपके खेत व मिट्टी के अनुसार दैनिक कार्य' : 'Daily operational checklist tailored to your farm allocation'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFull7DayModal(false)}
                className="rounded-full p-1 text-[var(--ink-soft)] hover:bg-[var(--surface-inset)]"
                aria-label={isHi ? 'बंद करें' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {default7Days.map((step) => (
                <div key={step.day} className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-inset)] p-3.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--field)] text-xs font-semibold text-white">
                    {step.day}
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--ink)]">{step.title}</h4>
                    <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowFull7DayModal(false)}
                className="btn btn-primary px-4 py-2 text-xs"
              >
                {isHi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. DETAILED EXPERT ANALYSIS MODAL                                      */}
      {/* ===================================================================== */}
      {showDetailedModal && decision && (
        <div className="scrim fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4">
          <div className="panel-modal max-h-[92vh] w-full max-w-5xl space-y-4 overflow-y-auto p-4 text-[var(--ink)] sm:p-6">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--grain-tint)] text-lg text-[var(--grain-deep)]">
                  🔬
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-[var(--ink)] sm:text-lg">
                    {isHi ? 'वैज्ञानिक एवं गणितीय निर्णय विश्लेषण' : 'Expert Decision & Optimization Analysis'}
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)]">
                    HiGHS Simplex Engine • ICAR Scientific Agronomy • Open-Meteo Professional Telemetry
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailedModal(false)}
                className="rounded-full border border-[var(--line)] bg-[var(--surface-inset)] p-2 text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                aria-label={isHi ? 'बंद करें' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Render full existing DetailedAnalysisView with all solvers, scenarios, and causality */}
            <div className="pt-2">
              <DetailedAnalysisView
                decision={decision}
                onReturnToFarmerView={() => setShowDetailedModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. FOOTER                                                              */}
      {/* ===================================================================== */}
      <footer className="border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--ink-soft)] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-[11px]">
          <span>{isHi ? 'ICAR कृषि इंजन एवं रीयल-टाइम मंडी डेटा द्वारा संचालित' : 'Powered by ICAR Agronomy Engine & Real-time Mandi Telemetry'}</span>
          <span>© 2026 AgriOptima AI</span>
        </div>
      </footer>
    </div>
  );
}
