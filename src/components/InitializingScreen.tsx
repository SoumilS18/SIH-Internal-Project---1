import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Layers, Droplets, IndianRupee, CloudSun, Sprout, Check } from 'lucide-react';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { useLanguage } from '@/i18n/LanguageContext';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { AIAgentOrb, type OrbState } from '@/components/AIAgentOrb';
import { FarmDigitalTwin } from '@/components/FarmDigitalTwin';
import { ProgressRing } from '@/components/ui/dataviz';

interface InitializingScreenProps {
  stateName: string;
  districtName: string;
  onReady: () => void;
}

/** Per-stage dwell + the hold on the final "strategy ready" beat. */
const STAGE_MS = 720;
const REVEAL_MS = 1200;
const EXIT_MS = 620;

interface Stage {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  en: string;
  hi: string;
  enSub: string;
  hiSub: string;
}

/**
 * The cinematic analysis sequence. Instead of a spinner, the intelligence core
 * visibly works through the farm — Location → Land → Water → Investment →
 * Climate → Crop suitability — over a faint scan of the living twin, then lands
 * on "YOUR FARM STRATEGY IS READY" before handing off to the dashboard.
 *
 * Contract preserved: reduced-motion hands off immediately via onReady().
 */
export function InitializingScreen({ stateName, districtName, onReady }: InitializingScreenProps) {
  const reduced = usePrefersReducedMotion();
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [exiting, setExiting] = useState(false);

  const STAGES: Stage[] = useMemo(
    () => [
      { icon: MapPin, en: 'Locating your farm', hi: 'आपका खेत खोजा जा रहा है', enSub: 'District & coordinates', hiSub: 'ज़िला और निर्देशांक' },
      { icon: Layers, en: 'Reading soil & terrain', hi: 'मिट्टी और भूमि का अध्ययन', enSub: 'Texture, depth & slope', hiSub: 'बनावट, गहराई और ढलान' },
      { icon: Droplets, en: 'Checking water & rainfall', hi: 'पानी और वर्षा की जाँच', enSub: '7-day forecast', hiSub: '7-दिन का पूर्वानुमान' },
      { icon: IndianRupee, en: 'Balancing cost & profit', hi: 'लागत और लाभ का संतुलन', enSub: 'Budget & expected returns', hiSub: 'बजट और अपेक्षित लाभ' },
      { icon: CloudSun, en: 'Reading the season', hi: 'मौसम का आकलन', enSub: 'Temperature & humidity', hiSub: 'तापमान और नमी' },
      { icon: Sprout, en: 'Matching the best crops', hi: 'सर्वोत्तम फसलें चुनना', enSub: 'For your exact field', hiSub: 'आपके खेत के लिए' },
    ],
    []
  );
  const total = STAGES.length;

  const orbState: OrbState = done ? 'complete' : step >= 5 ? 'recommending' : step >= 3 ? 'planning' : 'analyzing';

  useEffect(() => {
    if (reduced) {
      onReady();
      return;
    }
    const timers: number[] = [];
    for (let i = 1; i < total; i++) {
      timers.push(window.setTimeout(() => setStep(i), STAGE_MS * i));
    }
    timers.push(window.setTimeout(() => setDone(true), STAGE_MS * total));
    timers.push(window.setTimeout(() => setExiting(true), STAGE_MS * total + REVEAL_MS));
    timers.push(window.setTimeout(() => onReady(), STAGE_MS * total + REVEAL_MS + EXIT_MS));
    return () => timers.forEach(clearTimeout);
  }, [reduced, onReady, total]);

  // Reduced motion: onReady already fired; render a calm holding frame to avoid a flash.
  if (reduced) {
    return <div className="fixed inset-0 world-bg" aria-hidden />;
  }

  const percent = done ? 100 : Math.round(((step + 1) / total) * 100);
  const loc = `${getDistrictDisplayName(districtName, language)}, ${getStateDisplayName(stateName, language)}`;
  const cur = STAGES[Math.min(step, total - 1)];
  const CurIcon = cur.icon;

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: 'var(--canvas)', transition: `opacity ${EXIT_MS}ms var(--ease-out)`, opacity: exiting ? 0 : 1 }}
      role="status"
      aria-live="polite"
      aria-label={isHi ? 'खेत का विश्लेषण किया जा रहा है' : 'Analyzing your farm'}
    >
      {/* focus vignette toward the core */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(115% 85% at 50% 38%, transparent 42%, var(--canvas) 100%)' }}
      />

      {/* faint scan of the living twin — the object that carries through the flow */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[-6%] flex justify-center opacity-[0.32]"
        style={{
          maskImage: 'linear-gradient(to top, black 46%, transparent 96%)',
          WebkitMaskImage: 'linear-gradient(to top, black 46%, transparent 96%)',
        }}
      >
        <FarmDigitalTwin height={500} interactive={false} scanning showWeather={false} className="w-[min(940px,130%)]" />
      </div>

      {/* foreground column */}
      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <span className="t-eyebrow animate-rise" style={{ color: 'var(--field)' }}>
          {isHi ? 'बुद्धिमत्ता सक्रिय' : 'Intelligence engaged'}
        </span>

        {/* intelligence core wrapped in an analysis progress ring.
            Both the ring and the orb are pinned to the SAME grid cell (1/1) so
            they stack and stay concentric — this avoids relying on absolute/
            relative resolution, which would otherwise drop the orb into a
            second grid row and push it below the ring. */}
        <div className="relative mt-4 grid place-items-center" style={{ width: 256, height: 256 }}>
          <ProgressRing
            value={percent}
            size={256}
            stroke={3}
            tone="field"
            trackOpacity={0.45}
            className="[grid-area:1/1]"
          />
          <div className="grid place-items-center [grid-area:1/1]">
            <AIAgentOrb state={orbState} size={190} />
          </div>
        </div>

        {/* farm location */}
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3.5 py-1.5 text-sm font-semibold text-[var(--ink-soft)] backdrop-blur-sm">
          <MapPin size={14} className="text-[var(--field)]" />
          <span>{loc}</span>
        </div>

        {/* current analysis stage / final reveal */}
        <div className="mt-7 flex min-h-[92px] flex-col items-center justify-center">
          {!done ? (
            <div key={step} className="animate-rise flex flex-col items-center gap-2.5">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl animate-breathe"
                style={{ background: 'var(--field-tint)', color: 'var(--field-deep)' }}
              >
                <CurIcon size={20} />
              </span>
              <h2 className="t-h3 leading-tight text-[var(--ink)]">{isHi ? cur.hi : cur.en}</h2>
              <p className="text-sm text-[var(--ink-faint)]">{isHi ? cur.hiSub : cur.enSub}</p>
            </div>
          ) : (
            <div className="animate-scale-in flex flex-col items-center gap-2">
              <h2 className="t-display text-[clamp(1.4rem,4.6vw,2.4rem)] leading-[1.05] text-[var(--ink)]">
                {isHi ? 'आपकी खेत योजना तैयार है' : 'Your farm strategy is ready'}
              </h2>
              <p className="text-sm text-[var(--ink-soft)]">
                {isHi ? 'आपके खेत के लिए बनाई गई सिफ़ारिशें' : 'Built for your exact field'}
              </p>
            </div>
          )}
        </div>

        {/* stage rail */}
        <div className="mt-8 flex items-center gap-2.5" aria-hidden>
          {STAGES.map((s, i) => {
            const complete = done || i < step;
            const current = !done && i === step;
            const SIcon = s.icon;
            return (
              <span
                key={i}
                className="grid h-8 w-8 place-items-center rounded-full transition-all duration-500"
                style={{
                  background: complete ? 'var(--field)' : current ? 'var(--field-tint)' : 'var(--surface-inset)',
                  color: complete ? 'var(--ink-invert)' : current ? 'var(--field-deep)' : 'var(--ink-ghost)',
                  transform: current ? 'scale(1.12)' : 'scale(1)',
                  boxShadow: current ? '0 0 0 3px var(--field-tint)' : undefined,
                }}
              >
                {complete ? <Check size={14} strokeWidth={3} /> : <SIcon size={14} />}
              </span>
            );
          })}
        </div>

        {/* thin progress line */}
        <div className="mt-6 w-full max-w-sm">
          <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: 'var(--surface-inset)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${percent}%`,
                background: 'linear-gradient(90deg, var(--field), var(--grain))',
                transition: 'width 0.6s var(--ease-out)',
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between font-data text-[11px] text-[var(--ink-faint)]">
            <span>{String(done ? total : Math.min(step + 1, total)).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
            <span>{percent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
