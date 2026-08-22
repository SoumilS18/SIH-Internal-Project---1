import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import {
  ENGLISH_LANGUAGE,
  SCHEDULED_INDIAN_LANGUAGES,
  LanguageOption,
} from '@/i18n/languages';
import { useLanguage } from '@/i18n/LanguageContext';

export function LanguageSelector({ className = '' }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, languageOption } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (lang: LanguageOption) => {
    setIsOpen(false);
    setLanguage(lang.code);
  };

  const isHindi = language === 'hi';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/30 bg-forest-900/80 px-3 py-1.5 text-xs font-medium text-cream-100 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-gold-300/60 hover:bg-forest-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
      >
        <Globe size={13} className="text-gold-300" />
        <span className="font-sans font-medium">{languageOption.label}</span>
        <ChevronDown size={11} className={`text-cream-300/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 max-h-[420px] w-72 overflow-y-auto rounded-2xl border border-gold-300/25 bg-forest-900/95 p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 no-scrollbar"
          role="listbox"
          aria-label="Select Language"
        >
          {/* Header */}
          <div className="border-b border-gold-300/15 px-2.5 pb-2 pt-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-gold-300/80">
              {isHindi ? 'भाषा' : 'Language'}
            </span>
          </div>

          {/* SECTION 1: AVAILABLE LANGUAGES */}
          <div className="mt-2">
            <div className="px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-emerald-400">
              {isHindi ? 'उपलब्ध' : 'AVAILABLE'}
            </div>

            <div className="space-y-0.5">
              {/* English */}
              <button
                type="button"
                onClick={() => handleSelect(ENGLISH_LANGUAGE)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                  language === 'en'
                    ? 'bg-gold-300/15 font-semibold text-gold-200'
                    : 'text-cream-100 hover:bg-forest-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>English</span>
                  <span className="font-mono text-[10px] text-cream-300/50">(English)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] text-emerald-300">
                    AVAILABLE
                  </span>
                  {language === 'en' && <Check size={13} className="text-gold-300" />}
                </div>
              </button>

              {/* Hindi */}
              {SCHEDULED_INDIAN_LANGUAGES.filter((l) => l.code === 'hi').map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelect(l)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                    language === 'hi'
                      ? 'bg-gold-300/15 font-semibold text-gold-200'
                      : 'text-cream-100 hover:bg-forest-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{l.label}</span>
                    <span className="font-mono text-[10px] text-cream-300/50">({l.english})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[9px] text-emerald-300">
                      AVAILABLE
                    </span>
                    {language === 'hi' && <Check size={13} className="text-gold-300" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* DIVIDER */}
          <div className="my-2 border-t border-gold-300/15" />

          {/* SECTION 2: 22 INDIAN LANGUAGES (EIGHTH SCHEDULE) */}
          <div>
            <div className="px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-gold-300/80">
              {isHindi ? '22 भारतीय भाषाएं' : '22 INDIAN LANGUAGES'}
            </div>

            <div className="space-y-0.5">
              {SCHEDULED_INDIAN_LANGUAGES.map((l) => {
                const isSelected = language === l.code;
                const isAvail = l.status === 'available';

                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleSelect(l)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-1.5 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-gold-300/15 font-semibold text-gold-200'
                        : 'text-cream-200/90 hover:bg-forest-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{l.label}</span>
                      <span className="font-mono text-[10px] text-cream-300/50">({l.english})</span>
                    </div>

                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[8px] font-medium tracking-wide ${
                        isAvail
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-forest-950/80 text-cream-300/60 border border-gold-300/10'
                      }`}
                    >
                      {isAvail ? 'AVAILABLE' : 'COMING SOON'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
