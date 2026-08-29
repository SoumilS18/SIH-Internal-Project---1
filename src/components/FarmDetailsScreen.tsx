import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { JourneyNav } from '@/components/JourneyNav';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { getCropDisplayName } from '@/i18n/cropNames';
import { FarmDigitalTwin } from '@/components/FarmDigitalTwin';
import { Reveal, MagneticButton } from '@/components/ui/motion';
import { ReadingRow } from '@/components/ui/ReadingRow';
import { CropStandArt } from '@/components/ui/CropStandArt';
import {
  IRRIGATION,
  RELIABILITY,
  SEASONS,
  RISK,
  SEASON_CROPS,
  formatAcres,
  formatInrCompact,
  irrigationEntry,
  reliabilityEntry,
  riskEntry,
  seasonEntry,
  type IrrigationType,
  type Reliability,
  type RiskTolerance,
  type Season,
} from '@/lib/farmVocab';

interface FarmDetailsScreenProps {
  userName?: string;
  selectedState: string;
  selectedDistrict: string;
  landAcres: number;
  budgetInr: number;
  irrigationType: IrrigationType;
  irrigationReliability: Reliability;
  season: Season;
  riskTolerance: RiskTolerance;
  loading?: boolean;
  hasPlan?: boolean;
  onLandAcresChange: (acres: number) => void;
  onBudgetInrChange: (budget: number) => void;
  onIrrigationTypeChange: (type: IrrigationType) => void;
  onIrrigationReliabilityChange: (rel: Reliability) => void;
  onSeasonChange: (season: Season) => void;
  onRiskToleranceChange: (risk: RiskTolerance) => void;
  onGenerate: () => void;
  onChangeLocation: () => void;
  onViewPlan?: () => void;
  onProceedToSentinel?: () => void;
  onLogout?: () => void;
}

/* The drag range of each control. Typing goes further — a farmer with 60 acres
   is not locked out, the slider simply sits at its far end. */
const LAND_MIN = 0.5;
const LAND_MAX = 25;
const BUDGET_MIN = 5000;
const BUDGET_MAX = 2500000;

const fillStyle = (pct: number): React.CSSProperties =>
  ({ ['--fill']: `${Math.max(0, Math.min(100, pct))}%` } as React.CSSProperties);

/* -------------------------------------------------------------------------- */
/* DRAWN MARKS — the water and the sky, in the same hairline hand as the rest  */
/* of the world. Deliberately not emoji: emoji is the fastest way to make an   */
/* agritech product look like a game.                                          */
/* -------------------------------------------------------------------------- */
const svgProps = {
  width: 28,
  height: 28,
  viewBox: '0 0 28 28',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function WaterMark({ id, className }: { id: IrrigationType; className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      {id === 'Rainfed' && (
        <>
          <path d="M6.5 12a4.6 4.6 0 0 1 8.8-1.5A3.7 3.7 0 0 1 21.5 12" />
          <path d="M9.6 16.4 8.3 20" />
          <path d="M14.2 16.4 12.9 20" />
          <path d="M18.8 16.4 17.5 20" />
        </>
      )}
      {id === 'Borewell' && (
        <>
          <path d="M14 21V8" />
          <path d="M11 8h6" />
          <path d="M14 3.4c1.5 1.7 2.2 2.7 2.2 3.5a2.2 2.2 0 0 1-4.4 0c0-.8.7-1.8 2.2-3.5z" />
          <path d="M4 21h20" />
          <path d="M7.5 24.4q6.5-2.6 13 0" strokeDasharray="2 2.5" />
        </>
      )}
      {id === 'Canal' && (
        <>
          <path d="M3.5 9.5h21" />
          <path d="M3.5 19.5h21" />
          <path d="M4.5 14.5q3-2.6 6 0t6 0t6 0" />
          <path d="M4.5 17q3-2.6 6 0t6 0t6 0" strokeDasharray="3 3" />
        </>
      )}
      {id === 'Sprinkler' && (
        <>
          <path d="M14 21.5V13" />
          <path d="M10 21.5h8" />
          <path d="M5.5 12.5q8.5-8 17 0" />
          <path d="M8.5 14.5q5.5-4.8 11 0" strokeDasharray="2.5 3" />
          <circle cx="6.4" cy="16.6" r="1" />
          <circle cx="21.6" cy="16.6" r="1" />
        </>
      )}
      {id === 'Drip' && (
        <>
          <path d="M3.5 9h21" />
          <path d="M8.5 9v3.6" />
          <path d="M14 9v4.4" />
          <path d="M19.5 9v3.6" />
          <circle cx="8.5" cy="15.4" r="1.1" />
          <circle cx="14" cy="16.6" r="1.1" />
          <circle cx="19.5" cy="15.4" r="1.1" />
          <path d="M3.5 21h21" strokeDasharray="2 3" />
        </>
      )}
    </svg>
  );
}

function SkyMark({ id, className }: { id: Season; className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      {id === 'Kharif' && (
        <>
          <path d="M5.5 11.5a5 5 0 0 1 9.6-1.6A4 4 0 0 1 22.5 11.5" />
          <path d="M9.4 15.4 8 19.2" />
          <path d="M14.2 15.4 12.8 19.2" />
          <path d="M19 15.4 17.6 19.2" />
          <path d="M4 23.5h20" />
        </>
      )}
      {id === 'Rabi' && (
        <>
          <path d="M3.5 18.5h21" />
          <path d="M9 18.5a5 5 0 0 1 10 0" />
          <path d="M14 8.4V6" />
          <path d="M20.4 11.6 22 10.2" />
          <path d="M7.6 11.6 6 10.2" />
          <path d="M6 22.5h16" strokeDasharray="2 3" />
        </>
      )}
      {id === 'Zaid' && (
        <>
          <circle cx="14" cy="11" r="4.2" />
          <path d="M14 3.6V5" />
          <path d="M14 17v1.4" />
          <path d="M6.6 11H5.2" />
          <path d="M22.8 11h-1.4" />
          <path d="M8.8 5.8 7.8 4.8" />
          <path d="M19.2 5.8 20.2 4.8" />
          <path d="M5.5 22.5h17" strokeDasharray="2 3" />
          <path d="M8 25h12" strokeDasharray="2 3" />
        </>
      )}
    </svg>
  );
}

/** One acre, one parcel — the ribbon grows as the farmer drags. */
function ParcelRibbon({ acres }: { acres: number }) {
  const shown = Math.max(1, Math.min(14, Math.ceil(acres)));
  const extra = Math.max(0, Math.ceil(acres) - 14);
  return (
    <div className="flex items-end gap-[3px]" aria-hidden>
      {Array.from({ length: shown }).map((_, i) => (
        /* the entrance animation owns the outer transform slot, the skew the inner */
        <span key={i} className="animate-grow block" style={{ animationDelay: `${i * 32}ms` }}>
          <span
            className="block"
            style={{
              width: 15,
              height: 20 + (i % 3) * 4,
              borderRadius: 3,
              transform: 'skewX(-12deg)',
              background: 'linear-gradient(180deg, var(--field-tint), var(--sage-tint))',
              boxShadow: 'inset 0 2px 0 var(--field-bright), inset 0 0 0 1px rgb(var(--sh-color) / 0.06)',
            }}
          />
        </span>
      ))}
      {extra > 0 && (
        <span className="font-data ml-2 pb-1 text-[11px] text-[var(--ink-faint)]">+{extra}</span>
      )}
    </div>
  );
}

function SectionHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-data text-[11px] tracking-[0.18em] text-[var(--field)]">{n}</span>
      <h2 className="t-h3 whitespace-nowrap text-[var(--ink)]">{title}</h2>
      <span className="h-px flex-1" style={{ background: 'var(--line-soft)' }} aria-hidden />
    </div>
  );
}

/**
 * PAGE 3 — DESCRIBING THE LAND.
 *
 * Five questions, asked in the open rather than inside a form panel: the land
 * ribbon grows as it is dragged, the water is drawn rather than labelled, and
 * choosing a season stands its crops up out of the soil. Nothing is computed
 * here — submitting hands off to the analysis cinematic via onGenerate().
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

  const district = getDistrictDisplayName(selectedDistrict, language);
  const state = getStateDisplayName(selectedState, language);

  const waterEntry = irrigationEntry(irrigationType);
  const relEntry = reliabilityEntry(irrigationReliability);
  const seasonInfo = seasonEntry(season);
  const risk = riskEntry(riskTolerance);

  const landPct = ((Math.min(landAcres, LAND_MAX) - LAND_MIN) / (LAND_MAX - LAND_MIN)) * 100;
  const budgetPct = ((Math.min(budgetInr, BUDGET_MAX) - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;
  const perAcre = landAcres > 0 ? budgetInr / landAcres : 0;

  const seasonCrops = SEASON_CROPS[season] ?? [];

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between text-[var(--ink)] selection:bg-[var(--field-tint)] selection:text-[var(--field-deep)]">
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-10 pt-24 sm:px-8 sm:pt-28">
        {/* ================================================================= */}
        {/* THE ASK — no panel, no card. Just the question.                    */}
        {/* ================================================================= */}
        <Reveal>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="t-eyebrow flex items-center gap-2" style={{ color: 'var(--field)' }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-[var(--field)]" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--field)]" />
              </span>
              {isHi ? 'खेत की जानकारी' : 'Farm setup'}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-[var(--ink-faint)]">
              <MapPin size={13} className="text-[var(--grain-deep)]" />
              {district}, {state}
              <button
                type="button"
                onClick={onChangeLocation}
                className="ml-1 rounded-full px-2 py-0.5 text-[var(--field-deep)] transition-colors hover:bg-[var(--field-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--field)]"
              >
                {isHi ? 'बदलें' : 'Change'}
              </button>
            </span>
          </div>
          <h1 className="t-h1 mt-3 max-w-3xl text-[var(--ink)]">
            {isHi ? 'अपने खेत के बारे में बताइए' : 'Tell me about your farm'}
          </h1>
          <p className="t-lead mt-2.5 max-w-xl text-[0.95rem]">
            {isHi
              ? 'पाँच बातें — ज़मीन, पूँजी, पानी, मौसम और आपका रुख। इसके बाद AI आपके खेत को पढ़कर योजना बनाएगा।'
              : 'Five things — your land, your money, your water, the season and how you like to play it. The AI reads the farm after that.'}
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* =============================================================== */}
          {/* THE QUESTIONS                                                   */}
          {/* =============================================================== */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onGenerate();
            }}
            className="order-2 space-y-11 lg:order-1 lg:col-span-7"
          >
            {/* --- 01 LAND ------------------------------------------------- */}
            <Reveal>
              <SectionHead n="01" title={isHi ? 'आपकी ज़मीन' : 'Your land'} />
              <div className="flex items-end gap-4">
                <div className="w-[8.5rem]">
                  <input
                    type="number"
                    inputMode="decimal"
                    min={LAND_MIN}
                    max={100}
                    step={0.5}
                    value={landAcres}
                    onChange={(e) => onLandAcresChange(Math.max(LAND_MIN, parseFloat(e.target.value) || LAND_MIN))}
                    className="figure-input text-[clamp(2.1rem,6vw,3rem)] leading-none"
                    aria-label={isHi ? 'ज़मीन का आकार, एकड़ में' : 'Land size in acres'}
                  />
                </div>
                <span className="pb-2 text-sm text-[var(--ink-faint)]">
                  {isHi ? 'एकड़' : landAcres === 1 ? 'acre' : 'acres'}
                </span>
                <div className="ml-auto pb-1">
                  <ParcelRibbon acres={landAcres} />
                </div>
              </div>
              <input
                type="range"
                min={LAND_MIN}
                max={LAND_MAX}
                step={0.5}
                value={Math.min(landAcres, LAND_MAX)}
                onChange={(e) => onLandAcresChange(parseFloat(e.target.value))}
                className="range-field mt-5"
                style={fillStyle(landPct)}
                aria-label={isHi ? 'ज़मीन का आकार खींचकर चुनें' : 'Drag to set land size'}
              />
              <p className="mt-1 text-xs text-[var(--ink-ghost)]">
                {landAcres > LAND_MAX
                  ? isHi
                    ? `${formatAcres(landAcres, true)} — स्लाइडर की सीमा से अधिक, संख्या टाइप करके बदलें।`
                    : `${formatAcres(landAcres)} — past the slider, type to change it.`
                  : isHi
                    ? 'एक पट्टी = एक एकड़। खींचिए या संख्या टाइप कीजिए।'
                    : 'One parcel, one acre. Drag it or type the exact size.'}
              </p>
            </Reveal>

            {/* --- 02 BUDGET ----------------------------------------------- */}
            <Reveal>
              <SectionHead n="02" title={isHi ? 'इस मौसम की पूँजी' : 'What you can invest'} />
              <div className="flex items-end gap-3">
                <span className="pb-2 text-[clamp(1.3rem,3.5vw,1.8rem)] font-light text-[var(--ink-faint)]">₹</span>
                <div className="w-[13.5rem]">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={BUDGET_MIN}
                    step={5000}
                    value={budgetInr}
                    onChange={(e) =>
                      onBudgetInrChange(Math.max(BUDGET_MIN, parseInt(e.target.value, 10) || BUDGET_MIN))
                    }
                    className="figure-input text-[clamp(1.8rem,5vw,2.6rem)] leading-none"
                    aria-label={isHi ? 'निवेश बजट, रुपये में' : 'Investment budget in rupees'}
                  />
                </div>
                <span className="ml-auto pb-2 text-right text-sm text-[var(--ink-faint)]">
                  {formatInrCompact(budgetInr, isHi)}
                </span>
              </div>
              <input
                type="range"
                min={BUDGET_MIN}
                max={BUDGET_MAX}
                step={5000}
                value={Math.min(budgetInr, BUDGET_MAX)}
                onChange={(e) => onBudgetInrChange(parseInt(e.target.value, 10))}
                className="range-field range-grain mt-5"
                style={fillStyle(budgetPct)}
                aria-label={isHi ? 'बजट खींचकर चुनें' : 'Drag to set your budget'}
              />
              <p className="mt-1 text-xs text-[var(--ink-ghost)]">
                {budgetInr > BUDGET_MAX
                  ? isHi
                    ? `स्लाइडर की सीमा से अधिक (₹25 लाख) — ${formatInrCompact(perAcre, true)} प्रति एकड़। संख्या टाइप करके बदलें।`
                    : `Past the ₹25L slider range — ${formatInrCompact(perAcre)} per acre. Type to change exact amount.`
                  : isHi
                    ? `आपके बताए आकार पर ${formatInrCompact(perAcre, true)} प्रति एकड़।`
                    : `${formatInrCompact(perAcre)} per acre across the land you entered.`}
              </p>
            </Reveal>

            {/* --- 03 WATER ------------------------------------------------ */}
            <Reveal>
              <SectionHead n="03" title={isHi ? 'पानी कहाँ से आता है' : 'Where the water comes from'} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-2.5">
                {IRRIGATION.map((e) => {
                  const sel = irrigationType === e.id;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => onIrrigationTypeChange(e.id)}
                      className="choice choice-sky group flex-col items-center gap-1.5 px-2 py-3.5 text-center"
                    >
                      <WaterMark
                        id={e.id}
                        className={
                          sel
                            ? 'text-[var(--sky)]'
                            : 'text-[var(--ink-ghost)] transition-colors group-hover:text-[var(--sky)]'
                        }
                      />
                      <span className="text-xs font-medium leading-tight">{isHi ? e.hi : e.en}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="t-eyebrow text-[var(--ink-ghost)]">
                  {isHi ? 'कितना भरोसेमंद' : 'How dependable'}
                </span>
                <div className="flex gap-1.5">
                  {RELIABILITY.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={irrigationReliability === r.id}
                      onClick={() => onIrrigationReliabilityChange(r.id)}
                      className="choice choice-sky items-center px-3.5 py-1.5 text-xs font-medium"
                    >
                      {isHi ? r.hi : r.en}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-xs text-[var(--ink-ghost)]">
                {waterEntry && (isHi ? waterEntry.hiSub : waterEntry.enSub)}
                {waterEntry && relEntry ? ' · ' : ''}
                {relEntry && (isHi ? relEntry.hiSub : relEntry.enSub)}
              </p>
            </Reveal>

            {/* --- 04 SEASON ----------------------------------------------- */}
            <Reveal>
              <SectionHead n="04" title={isHi ? 'कौन सा मौसम बो रहे हैं' : 'The season you are sowing'} />
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {SEASONS.map((s) => {
                  const sel = season === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => onSeasonChange(s.id)}
                      className="choice group flex-col items-start gap-1.5 p-4 text-left"
                    >
                      <SkyMark
                        id={s.id}
                        className={
                          sel
                            ? 'text-[var(--field)]'
                            : 'text-[var(--ink-ghost)] transition-colors group-hover:text-[var(--field)]'
                        }
                      />
                      <span className="mt-1 text-sm font-medium">{isHi ? s.hi : s.en}</span>
                      <span className="text-[11px] leading-snug text-[var(--ink-faint)]">
                        {isHi ? s.hiSub : s.enSub}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* the crops of that window stand up out of the soil */}
              <div className="mt-6">
                <div className="flex items-end justify-between gap-4">
                  <div key={season} className="flex items-end gap-5">
                    {seasonCrops.map((c, i) => (
                      <div key={c} className="flex flex-col items-center gap-1.5">
                        <CropStandArt name={c} delayMs={i * 110} />
                        <span className="text-[11px] text-[var(--ink-faint)]">
                          {getCropDisplayName(c, language)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <span className="max-w-[13rem] pb-1 text-right text-[11px] leading-snug text-[var(--ink-ghost)]">
                    {isHi
                      ? 'इस मौसम में आम तौर पर बोई जाने वाली फसलें। आपकी असल फसलें AI चुनेगा।'
                      : 'Commonly sown in this window. Your actual crops are chosen by the AI.'}
                  </span>
                </div>
                <div className="mt-1.5 h-px" style={{ background: 'var(--line)' }} aria-hidden />
              </div>
            </Reveal>

            {/* --- 05 RISK ------------------------------------------------- */}
            <Reveal>
              <SectionHead n="05" title={isHi ? 'आपका रुख' : 'How you want to play it'} />
              <div className="grid grid-cols-3 gap-2.5">
                {RISK.map((r) => {
                  const sel = riskTolerance === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={sel}
                      onClick={() => onRiskToleranceChange(r.id)}
                      className="choice choice-grain flex-col items-start gap-1 px-3.5 py-3 text-left"
                    >
                      <span className="text-sm font-medium">{isHi ? r.hi : r.en}</span>
                      <span className="text-[11px] leading-snug text-[var(--ink-faint)]">
                        {isHi ? r.hiSub : r.enSub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Reveal>

            {/* --- HAND OFF ------------------------------------------------ */}
            <div>
              <MagneticButton
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg group w-full disabled:opacity-60"
              >
                <span>
                  {loading
                    ? isHi
                      ? 'खेत पढ़ा जा रहा है…'
                      : 'Reading your farm…'
                    : isHi
                      ? 'मेरे खेत की योजना बनाइए'
                      : 'Plan my farm'}
                </span>
                {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
              </MagneticButton>
              <p className="mt-2.5 text-center text-xs text-[var(--ink-ghost)]">
                {isHi
                  ? 'अभी कुछ भी गणना नहीं हुई — अगले कदम पर AI आपके खेत को पढ़ेगा।'
                  : 'Nothing is calculated yet — next, the AI reads the farm you just described.'}
              </p>
            </div>
          </form>

          {/* =============================================================== */}
          {/* THE LAND ITSELF — stays in view while the questions are answered */}
          {/* =============================================================== */}
          <aside className="order-1 lg:order-2 lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <FarmDigitalTwin
                height={320}
                interactive
                showWeather
                aiState="listening"
                className="w-full"
              />
              <div className="mt-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--field)]" aria-hidden />
                <span className="t-eyebrow text-[var(--ink-ghost)]">
                  {isHi ? 'आपकी ज़मीन · जीवित पूर्वावलोकन' : 'Your land · live preview'}
                </span>
              </div>

              <div className="mt-6 space-y-2.5">
                <ReadingRow
                  label={isHi ? 'स्थान' : 'Location'}
                  value={`${district}, ${state}`}
                />
                <ReadingRow label={isHi ? 'भूमि' : 'Land'} value={formatAcres(landAcres, isHi)} />
                <ReadingRow
                  label={isHi ? 'निवेश' : 'Investment'}
                  value={formatInrCompact(budgetInr, isHi)}
                />
                <ReadingRow
                  label={isHi ? 'पानी' : 'Water'}
                  value={`${waterEntry ? (isHi ? waterEntry.hi : waterEntry.en) : '—'}${
                    relEntry ? ` · ${isHi ? relEntry.hi : relEntry.en}` : ''
                  }`}
                />
                <ReadingRow
                  label={isHi ? 'मौसम' : 'Season'}
                  value={seasonInfo ? (isHi ? seasonInfo.hi : seasonInfo.en) : '—'}
                />
                <ReadingRow
                  label={isHi ? 'रुख' : 'Approach'}
                  value={risk ? (isHi ? risk.hi : risk.en) : '—'}
                />
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="px-5 pb-24 pt-4 text-xs text-[var(--ink-ghost)] sm:px-8 md:pb-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-3 text-[11px]">
          <span>
            {isHi
              ? 'ICAR कृषि इंजन एवं रीयल-टाइम मंडी डेटा द्वारा संचालित'
              : 'Powered by the ICAR agronomy engine and live mandi telemetry'}
          </span>
          <span>© 2026 AgriOptima AI</span>
        </div>
      </footer>
    </div>
  );
}
