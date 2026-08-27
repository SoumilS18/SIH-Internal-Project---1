import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { useLanguage } from '@/i18n/LanguageContext';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { FarmDigitalTwin } from '@/components/FarmDigitalTwin';
import {
  formatAcres,
  formatInrCompact,
  irrigationEntry,
  label,
  reliabilityEntry,
  seasonEntry,
  type IrrigationType,
  type Reliability,
  type Season,
} from '@/lib/farmVocab';
import type { FarmDecisionResponse } from '@/types/farm';

interface InitializingScreenProps {
  stateName: string;
  districtName: string;
  /** Fires once the cinematic is fully out of the way. */
  onReady: () => void;
  /**
   * Fires while the overlay is still covering the screen, just before it fades.
   * Lets the page underneath swap to the plan so the fade is a real cross-fade
   * instead of a flash of the form the farmer just left.
   */
  onPrepare?: () => void;
  /* The farmer's own inputs. Optional so older call sites keep working. */
  landAcres?: number;
  budgetInr?: number;
  irrigationType?: IrrigationType;
  irrigationReliability?: Reliability;
  season?: Season;
  /** Lands mid-flight: fills in soil, and plants the real allocation on the last beat. */
  decision?: FarmDecisionResponse | null;
}

/** Per-factor dwell, the hold on "strategy ready", and the cross-fade out. */
const STAGE_MS = 780;
const REVEAL_MS = 1500;
const EXIT_MS = 650;

type FactorKey = 'location' | 'land' | 'soil' | 'water' | 'climate' | 'investment';

interface Factor {
  key: FactorKey;
  en: string;
  hi: string;
  /** The real datum. Null while it is still unknown — we never invent one. */
  value: string | null;
  /** Stands in for the value only until the datum arrives. */
  pendingEn: string;
  pendingHi: string;
  /** Second line: context for the value, always factual. */
  note: string | null;
  /** The point on the land this reading refers to, in % of the viewport. */
  x: number;
  y: number;
  side: 'left' | 'right';
}

/* -------------------------------------------------------------------------- */
/* THE READING                                                                */
/*                                                                            */
/* The AI does not hover above the farm inside a progress ring — it reads the  */
/* land and marks it up. Six factors in order, each pinned to the ground with  */
/* a surveyor's hairline, and the marks accumulate: by the last beat the whole */
/* field is annotated, which is what "the AI understood my farm" looks like.   */
/* Every value shown is the farmer's own input or a field of the response.     */
/* -------------------------------------------------------------------------- */
export function InitializingScreen({
  stateName,
  districtName,
  onReady,
  onPrepare,
  landAcres,
  budgetInr,
  irrigationType,
  irrigationReliability,
  season,
  decision,
}: InitializingScreenProps) {
  const reduced = usePrefersReducedMotion();
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [exiting, setExiting] = useState(false);

  /* The scene is sized to the viewport rather than a shrunken desktop layout. */
  const [vh, setVh] = useState(() => (typeof window === 'undefined' ? 820 : window.innerHeight));
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* One hand-off, whether the timeline runs out or the farmer skips ahead. */
  const prepared = useRef(false);
  const handed = useRef(false);
  const prepare = useCallback(() => {
    if (prepared.current) return;
    prepared.current = true;
    onPrepare?.();
  }, [onPrepare]);
  const finish = useCallback(() => {
    if (handed.current) return;
    handed.current = true;
    onReady();
  }, [onReady]);

  const req = decision?.request;
  const acres = landAcres ?? req?.land_size_acres ?? null;
  const budget = budgetInr ?? req?.budget_inr ?? null;
  const water = irrigationType ?? req?.irrigation_type ?? null;
  const reliability = irrigationReliability ?? req?.irrigation_reliability ?? null;
  const sown = season ?? req?.season ?? null;
  const soil = decision?.location?.major_soil_type ?? null;
  const zone = decision?.location?.agro_climatic_zone ?? null;

  const district = getDistrictDisplayName(districtName, language);
  const state = getStateDisplayName(stateName, language);

  const FACTORS = useMemo<Factor[]>(() => {
    const waterEntry = irrigationEntry(water);
    const relEntry = reliabilityEntry(reliability);
    const seasonInfo = seasonEntry(sown);
    const waterValue = waterEntry
      ? `${label(waterEntry, water, isHi)}${relEntry ? ` · ${label(relEntry, reliability, isHi)}` : ''}`
      : null;

    return [
      {
        key: 'location',
        en: 'Location',
        hi: 'स्थान',
        value: district ? `${district}, ${state}` : null,
        pendingEn: 'Placing your farm',
        pendingHi: 'खेत का स्थान',
        note: zone,
        x: 30,
        y: 44,
        side: 'left',
      },
      {
        key: 'land',
        en: 'Land',
        hi: 'भूमि',
        value: acres != null ? formatAcres(acres, isHi) : null,
        pendingEn: 'Measuring the field',
        pendingHi: 'खेत की माप',
        note: isHi ? 'आपके बताए अनुसार' : 'As you told us',
        x: 70,
        y: 40,
        side: 'right',
      },
      {
        key: 'soil',
        en: 'Soil',
        hi: 'मिट्टी',
        value: soil,
        pendingEn: 'Sampling the soil',
        pendingHi: 'मिट्टी की जाँच',
        note: isHi ? 'ज़िले की मिट्टी' : 'District soil profile',
        x: 24,
        y: 59,
        side: 'left',
      },
      {
        key: 'water',
        en: 'Water',
        hi: 'पानी',
        value: waterValue,
        pendingEn: 'Tracing the water',
        pendingHi: 'पानी का स्रोत',
        note: waterEntry ? (isHi ? waterEntry.hiSub : waterEntry.enSub) : null,
        x: 76,
        y: 56,
        side: 'right',
      },
      {
        key: 'climate',
        en: 'Climate',
        hi: 'मौसम',
        value: seasonInfo ? label(seasonInfo, sown, isHi) : null,
        pendingEn: 'Reading the season',
        pendingHi: 'मौसम का आकलन',
        note: seasonInfo ? (isHi ? seasonInfo.hiSub : seasonInfo.enSub) : null,
        x: 28,
        y: 73,
        side: 'left',
      },
      {
        key: 'investment',
        en: 'Investment',
        hi: 'निवेश',
        value: budget != null ? formatInrCompact(budget, isHi) : null,
        pendingEn: 'Weighing the budget',
        pendingHi: 'बजट का आकलन',
        note: isHi ? 'इस मौसम के लिए' : 'Available this season',
        x: 72,
        y: 70,
        side: 'right',
      },
    ];
  }, [acres, budget, district, isHi, reliability, soil, sown, state, water, zone]);

  const total = FACTORS.length;

  useEffect(() => {
    if (reduced) {
      prepare();
      finish();
      return;
    }
    const timers: number[] = [];
    for (let i = 1; i < total; i++) {
      timers.push(window.setTimeout(() => setStep(i), STAGE_MS * i));
    }
    timers.push(window.setTimeout(() => setDone(true), STAGE_MS * total));
    timers.push(
      window.setTimeout(() => {
        prepare();
        setExiting(true);
      }, STAGE_MS * total + REVEAL_MS)
    );
    timers.push(window.setTimeout(finish, STAGE_MS * total + REVEAL_MS + EXIT_MS));
    return () => timers.forEach(clearTimeout);
  }, [reduced, prepare, finish, total]);

  /* Nobody should be trapped in a cinematic. */
  const skip = useCallback(() => {
    prepare();
    setExiting(true);
    window.setTimeout(finish, 280);
  }, [prepare, finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skip]);

  // Reduced motion: the hand-off already happened; hold a calm frame so the
  // swap underneath never flashes through.
  if (reduced) {
    return <div className="world-bg fixed inset-0 z-[60]" aria-hidden />;
  }

  const cur = FACTORS[Math.min(step, total - 1)];
  const headline = cur.value ?? (isHi ? cur.pendingHi : cur.pendingEn);
  const twinHeight = Math.round(Math.max(300, Math.min(660, vh * 0.62)));
  const aiState = done ? 'complete' : step >= 3 ? 'planning' : 'analyzing';

  return (
    <div
      className="world-bg fixed inset-0 z-[60] overflow-hidden"
      style={{ transition: `opacity ${EXIT_MS}ms var(--ease-out)`, opacity: exiting ? 0 : 1 }}
      aria-busy={!done}
    >
      {/* morning light from the upper left, and a soft focus falloff at the edges */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 50% at 18% -6%, var(--glow-sun), transparent 62%), radial-gradient(120% 78% at 50% 44%, transparent 46%, rgb(var(--sh-color) / 0.05) 100%)',
        }}
        aria-hidden
      />

      {/* ------------------------------------------------------------------ */}
      {/* THE FARM — the hero of this moment, not a watermark behind it.      */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[-3%] flex items-end justify-center"
        style={{ top: '24%' }}
      >
        <FarmDigitalTwin
          /* Once the strategy exists, the land quietly becomes the real plan. */
          decision={done ? decision ?? null : null}
          height={twinHeight}
          interactive={false}
          scanning={!done}
          aiState={aiState}
          showDetailCard={false}
          showWeather
          className="w-[min(1180px,120%)]"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SURVEY MARKS — every reading pinned to the ground it came from.     */}
      {/* Desktop and tablet only; small screens read the stacked list below. */}
      {/* ------------------------------------------------------------------ */}
      <div className="pointer-events-none absolute inset-0 z-[5] hidden md:block" aria-hidden>
        {FACTORS.map((f, i) => {
          const shown = (done || i <= step) && !!f.value;
          const left = f.side === 'left';
          return (
            <div
              key={f.key}
              className="absolute flex items-center gap-2.5"
              style={{
                left: `${f.x}%`,
                top: `${f.y}%`,
                /* the dot sits on f.x; the label runs outward from it */
                transform: `translate(${left ? '-100%' : '0'}, -50%)`,
                flexDirection: left ? 'row' : 'row-reverse',
                opacity: shown ? (done ? 0.66 : i === step ? 1 : 0.68) : 0,
                transition: 'opacity 700ms var(--ease-out)',
              }}
            >
              <span
                className="block whitespace-nowrap text-[13px] font-medium leading-snug text-[var(--ink)]"
                style={{
                  textAlign: left ? 'right' : 'left',
                  transform: shown ? 'translateY(0)' : 'translateY(7px)',
                  transition: 'transform 700ms var(--ease-out) 120ms',
                }}
              >
                {f.value}
              </span>
              {/* the hairline, drawn from the label back to the land */}
              <span
                className="block h-px w-9 shrink-0 lg:w-14"
                style={{
                  background: `linear-gradient(${left ? '90deg' : '270deg'}, var(--sage), var(--field))`,
                  transformOrigin: left ? 'left center' : 'right center',
                  transform: `scaleX(${shown ? 1 : 0})`,
                  transition: 'transform 620ms var(--ease-out)',
                }}
              />
              {/* the point it refers to */}
              <span
                className="block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  background: 'var(--field)',
                  boxShadow: '0 0 0 4px var(--field-tint)',
                  transform: `scale(${shown ? 1 : 0})`,
                  transition: 'transform 520ms var(--ease-spring) 220ms',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* THE READING ITSELF — one factor at a time, in the farmer's numbers. */}
      {/* ------------------------------------------------------------------ */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center px-6 pt-[7vh] text-center">
        {!done ? (
          <>
            <span className="t-eyebrow" style={{ color: 'var(--field)' }}>
              {isHi ? 'खेत पढ़ा जा रहा है' : 'Reading your farm'}
              <span className="font-data ml-2 text-[var(--ink-ghost)]">
                {String(Math.min(step + 1, total)).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
            </span>
            <div key={cur.key} className="animate-rise mt-3 flex flex-col items-center">
              <span className="t-eyebrow text-[var(--ink-ghost)]">{isHi ? cur.hi : cur.en}</span>
              <h2
                className="t-display mt-1.5 max-w-[22ch] text-[clamp(1.6rem,5.2vw,3rem)] leading-[1.06] text-[var(--ink)]"
                style={{ textWrap: 'balance' } as React.CSSProperties}
              >
                {headline}
              </h2>
              {cur.note && <p className="mt-2 max-w-[34ch] text-sm text-[var(--ink-faint)]">{cur.note}</p>}
            </div>
          </>
        ) : (
          <div className="animate-rise flex flex-col items-center">
            <span className="t-eyebrow" style={{ color: 'var(--field)' }}>
              {isHi ? 'सब कुछ समझ लिया' : 'The farm is understood'}
            </span>
            <h2 className="plan-title mt-2 text-[clamp(1.8rem,6vw,3.6rem)] leading-[1.02]">
              {isHi ? 'खेत की रणनीति तैयार है' : 'Farm strategy ready'}
            </h2>
            <p className="mt-3 max-w-[42ch] text-sm text-[var(--ink-soft)]">
              {decision?.explanation?.headline ??
                (isHi ? `${district} के आपके खेत के लिए` : `Built for your field in ${district}`)}
            </p>
          </div>
        )}

        {/* small screens: the readings stack under the line instead of pinning */}
        <div className="mt-7 flex w-full max-w-sm flex-col gap-2 md:hidden">
          {FACTORS.map((f, i) => {
            const shown = (done || i < step) && !!f.value;
            return (
              <div
                key={f.key}
                className="flex items-baseline gap-3"
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown ? 'translateY(0)' : 'translateY(5px)',
                  transition: 'opacity 500ms var(--ease-out), transform 500ms var(--ease-out)',
                }}
              >
                <span className="t-eyebrow shrink-0 text-[var(--ink-ghost)]">{isHi ? f.hi : f.en}</span>
                <span
                  className="h-px min-w-3 flex-1"
                  style={{ background: 'var(--line)', transform: 'translateY(-4px)' }}
                  aria-hidden
                />
                <span className="shrink-0 text-[13px] font-medium text-[var(--ink-soft)]">{f.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* leaving early is always allowed */}
      <button
        type="button"
        onClick={skip}
        className="absolute bottom-5 right-5 z-20 rounded-full px-3.5 py-2 text-xs text-[var(--ink-ghost)] transition-colors hover:bg-[var(--surface-solid)] hover:text-[var(--ink-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--field)]"
      >
        {isHi ? 'सीधे योजना देखें' : 'Skip to plan'}
      </button>

      {/* what a screen reader hears, without the choreography */}
      <p className="sr-only" role="status">
        {done
          ? isHi
            ? 'खेत की रणनीति तैयार है'
            : 'Farm strategy ready'
          : `${isHi ? cur.hi : cur.en}: ${headline}`}
      </p>
    </div>
  );
}
