import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Sparkles, Compass, Cpu, Droplets, LineChart } from 'lucide-react';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { useLanguage } from '@/i18n/LanguageContext';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';

interface InitializingScreenProps {
  stateName: string;
  districtName: string;
  onReady: () => void;
}

export function InitializingScreen({
  stateName,
  districtName,
  onReady,
}: InitializingScreenProps) {
  const [step, setStep] = useState(0);
  const reduced = usePrefersReducedMotion();
  const { t, language } = useLanguage();

  const STEPS = [
    { label: t('init.step1'), icon: Droplets },
    { label: t('init.step2'), icon: LineChart },
    { label: t('init.step3'), icon: Cpu },
  ];

  useEffect(() => {
    if (reduced) {
      onReady();
      return;
    }

    const t1 = setTimeout(() => setStep(1), 220);
    const t2 = setTimeout(() => setStep(2), 440);
    const t3 = setTimeout(() => onReady(), 680);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reduced, onReady]);

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-forest-950 px-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(4,43,29,0.7)_0%,rgba(2,21,16,0.98)_70%,rgba(2,21,16,1)_100%)]" />
        <div className="absolute inset-0 grid-texture radial-fade opacity-15" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gold-300/20 bg-forest-900/70 p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md sm:p-8">
        {/* Animated Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-300/30 bg-gradient-to-br from-gold-400/20 to-forest-800/80 shadow-[0_0_24px_rgba(255,210,26,0.2)]">
          <Sparkles className="h-7 w-7 animate-pulse text-gold-300" />
        </div>

        <h2 className="mt-4 font-serif text-xl font-bold text-cream-100 sm:text-2xl">
          {t('init.title')}
        </h2>

        {/* Location pill */}
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-gold-300/20 bg-forest-950/70 px-3 py-1 text-xs text-gold-200">
          <Compass size={12} className="text-gold-300" />
          <span>
            {getDistrictDisplayName(districtName, language)}, {getStateDisplayName(stateName, language)}
          </span>
        </div>

        {/* Stepper Progress */}
        <div className="mt-6 space-y-2.5 text-left font-mono text-xs">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isDone = step > idx;
            const isCurrent = step === idx;

            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition-all duration-300 ${
                  isDone
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : isCurrent
                    ? 'border-gold-300/40 bg-gold-300/10 text-gold-100 shadow-[0_0_12px_rgba(255,210,26,0.15)]'
                    : 'border-forest-800/30 bg-forest-950/40 text-cream-300/40'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 size={15} className="shrink-0 animate-spin text-gold-300" />
                ) : (
                  <Icon size={15} className="shrink-0 text-cream-300/30" />
                )}
                <span className="text-[11px] leading-tight">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
