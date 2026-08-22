import React from 'react';
import { Globe, ArrowRight, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export function LanguageComingSoonModal() {
  const { comingSoonModalTarget, closeComingSoonModal, setLanguage, languageOption, t } =
    useLanguage();

  if (!comingSoonModalTarget) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/80 px-4 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-gold-300/30 bg-forest-900/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8">
        {/* Top Header Icon */}
        <div className="flex items-center justify-between border-b border-gold-300/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-300/30 bg-gold-400/10 text-gold-300">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-gold-300/80">
                Multilingual Roadmap
              </span>
              <h3 id="coming-soon-title" className="font-serif text-lg font-bold text-cream-100">
                {comingSoonModalTarget.label} ({comingSoonModalTarget.english})
              </h3>
            </div>
          </div>

          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300">
            COMING SOON
          </span>
        </div>

        {/* Modal Body */}
        <div className="mt-5 space-y-3.5 text-xs leading-relaxed text-cream-200/90">
          <p className="font-serif text-sm font-semibold text-gold-200">
            {comingSoonModalTarget.english} support is coming soon.
          </p>

          <p className="text-cream-300/80">
            Full support for <strong>{comingSoonModalTarget.english} ({comingSoonModalTarget.label})</strong> is currently under active development as part of our multilingual agritech roadmap.
          </p>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-emerald-200">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>AgriOptima AI currently supports English and हिन्दी (Hindi).</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-300/80">
              Your language preference for {comingSoonModalTarget.english} has been saved and will be available in a future release.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeComingSoonModal}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gold-300/20 bg-forest-950/60 px-4 py-2.5 font-mono text-xs text-cream-200 transition-colors hover:border-gold-300/50 hover:text-cream-100 focus:outline-none"
          >
            <ArrowLeft size={13} />
            <span>Back to Languages</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLanguage('en');
              closeComingSoonModal();
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gold-300/50 bg-gradient-to-r from-gold-400 to-gold-500 px-5 py-2.5 font-serif text-xs font-semibold text-forest-950 shadow-[0_0_20px_rgba(255,210,26,0.25)] transition-all hover:brightness-110 focus:outline-none"
          >
            <Sparkles size={13} />
            <span>Continue in English</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
