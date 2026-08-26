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
  const isHi = language === 'hi';

  const STEPS = [
    { label: isHi ? 'मौसम व 7-दिवसीय वर्षा पूर्वानुमान का संकलन...' : 'Fetching 7-day weather & rainfall forecast...', icon: Droplets },
    { label: isHi ? 'मिट्टी की बनावट व जल धारण क्षमता का विश्लेषण...' : 'Analyzing soil texture & root-zone moisture...', icon: LineChart },
    { label: isHi ? 'सर्वोत्तम कृषि लाभ योजना की गणना...' : 'Optimizing crop allocation & expected returns...', icon: Cpu },
  ];

  useEffect(() => {
    if (reduced) {
      onReady();
      return;
    }

    const t1 = setTimeout(() => setStep(1), 220);
    const t2 = setTimeout(() => setStep(2), 440);
    const t3 = setTimeout(() => onReady(), 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [reduced, onReady]);

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#FAF7F2] px-4">
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#EDE4D5] bg-[#FFFFFF] p-6 text-center shadow-xl sm:p-8 space-y-4">
        {/* Animated Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#F9D0C5] bg-[#FDEEE9] shadow-sm">
          <Sparkles className="h-7 w-7 animate-pulse text-[#E2725B]" />
        </div>

        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1F2937]">
            {isHi ? 'खेत विश्लेषण तैयार हो रहा है' : 'Initializing Farm Intelligence'}
          </h2>

          {/* Location pill */}
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#D4E7DC] bg-[#EAF3ED] px-3 py-1 text-xs font-semibold text-[#2D5A43]">
            <Compass size={13} className="text-[#3F7253]" />
            <span>
              {getDistrictDisplayName(districtName, language)}, {getStateDisplayName(stateName, language)}
            </span>
          </div>
        </div>

        {/* Stepper Progress */}
        <div className="mt-4 space-y-2 text-left text-xs">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isDone = step > idx;
            const isCurrent = step === idx;

            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition-all duration-300 ${
                  isDone
                    ? 'border-[#D4E7DC] bg-[#EAF3ED] text-[#2D5A43]'
                    : isCurrent
                    ? 'border-[#F9D0C5] bg-[#FDEEE9] text-[#B54832] shadow-xs'
                    : 'border-[#EDE4D5] bg-[#FAF7F2] text-[#9CA3AF]'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 size={15} className="shrink-0 text-[#3F7253]" />
                ) : isCurrent ? (
                  <Loader2 size={15} className="shrink-0 animate-spin text-[#E2725B]" />
                ) : (
                  <Icon size={15} className="shrink-0 text-[#9CA3AF]" />
                )}
                <span className="text-xs font-medium leading-tight">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

