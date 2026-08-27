import { useEffect, useRef } from 'react';
import { Globe, ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

/**
 * Multilingual roadmap notice. Logic is untouched — it still reads
 * `comingSoonModalTarget`, closes via `closeComingSoonModal`, and offers
 * "Continue in English" which calls `setLanguage('en')`. Only the presentation
 * moved into the light world, plus Escape-to-close for keyboard users.
 */
export function LanguageComingSoonModal() {
  const { comingSoonModalTarget, closeComingSoonModal, setLanguage } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape closes the dialog; focus moves into it on open.
  useEffect(() => {
    if (!comingSoonModalTarget) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeComingSoonModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [comingSoonModalTarget, closeComingSoonModal]);

  if (!comingSoonModalTarget) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
    >
      {/* scrim — warm ivory haze, never black */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={closeComingSoonModal}
        className="scrim absolute inset-0 cursor-default"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="panel-modal relative w-full max-w-lg overflow-hidden p-6 outline-none sm:p-8"
        style={{ animation: 'planFadeUp 0.4s var(--ease-out) both' }}
      >
        {/* corner sunlight, for depth without a border */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full blur-3xl"
          style={{ background: 'var(--glow-grain)' }}
          aria-hidden
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="leaf-radius grid h-11 w-11 place-items-center bg-[var(--sky-tint)] text-[var(--sky)]">
              <Globe size={20} />
            </span>
            <div>
              <span className="t-eyebrow">Multilingual roadmap</span>
              <h3 id="coming-soon-title" className="t-h3 mt-1 text-[var(--ink)]">
                {comingSoonModalTarget.label}{' '}
                <span className="font-normal text-[var(--ink-faint)]">
                  ({comingSoonModalTarget.english})
                </span>
              </h3>
            </div>
          </div>

          <span className="chip chip-grain shrink-0">Coming soon</span>
        </div>

        <div className="relative mt-5 space-y-3">
          <p className="text-[15px] font-medium text-[var(--ink)]">
            {comingSoonModalTarget.english} support is on the way.
          </p>
          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
            Full support for{' '}
            <strong className="font-semibold text-[var(--ink)]">
              {comingSoonModalTarget.english} ({comingSoonModalTarget.label})
            </strong>{' '}
            is in active development as part of our multilingual agritech roadmap.
          </p>

          <div className="inset flex gap-3 p-4">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--field)]" />
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">
                AgriOptima AI currently supports English and हिन्दी.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--ink-faint)]">
                Your preference for {comingSoonModalTarget.english} is saved and will apply in a
                future release.
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeComingSoonModal}
            className="btn btn-ghost text-sm"
          >
            <ArrowLeft size={15} />
            <span>Back to languages</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLanguage('en');
              closeComingSoonModal();
            }}
            className="btn btn-primary group text-sm"
          >
            <Sparkles size={15} />
            <span>Continue in English</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
