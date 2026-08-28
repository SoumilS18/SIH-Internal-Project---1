import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import {
  ENGLISH_LANGUAGE,
  SCHEDULED_INDIAN_LANGUAGES,
  LanguageOption,
} from '@/i18n/languages';
import { useLanguage } from '@/i18n/LanguageContext';

export function LanguageSelector({
  className = '',
  align = 'auto',
  variant = 'pill',
}: {
  className?: string;
  align?: 'left' | 'right' | 'auto';
  /** `pill` floats on its own; `bare` sits inside an existing pill group. */
  variant?: 'pill' | 'bare';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, languageOption } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [computedAlign, setComputedAlign] = useState<'left' | 'right'>('right');

  // Close dropdown on click outside and compute optimal alignment
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen && dropdownRef.current) {
      document.addEventListener('mousedown', handleClickOutside);
      if (align === 'auto') {
        const rect = dropdownRef.current.getBoundingClientRect();
        // If button is close to the left edge (< 290px from left), anchor left; otherwise anchor right
        if (rect.left < 290) {
          setComputedAlign('left');
        } else {
          setComputedAlign('right');
        }
      } else {
        setComputedAlign(align);
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, align]);

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
        className={
          variant === 'pill'
            ? 'nav-pill inline-flex h-9 cursor-pointer items-center gap-1.5 px-3 text-xs font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] focus:outline-none'
            : 'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-[var(--ink-soft)] transition-colors hover:bg-[var(--field-tint)] hover:text-[var(--ink)] focus:outline-none'
        }
      >
        <Globe size={13} className="text-[var(--field)]" />
        <span className="font-sans">{languageOption.label}</span>
        <ChevronDown size={11} className={`text-[var(--ink-ghost)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu (Guaranteed Viewport Safe) */}
      {isOpen && (
        <div
          className={`absolute ${
            computedAlign === 'left' ? 'left-0' : 'right-0'
          } top-full z-50 mt-2 max-h-[min(420px,75vh)] w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-[26px] bg-[var(--surface-elevated)] p-2.5 shadow-[0_30px_70px_rgb(var(--sh-color)/0.16)] backdrop-blur-xl animate-scale-in text-[var(--ink)] overscroll-contain`}
          role="listbox"
          aria-label="Select Language"
        >
          {/* Header */}
          <div className="border-b border-[var(--line)] px-2.5 pb-2 pt-1">
            <span className="font-serif text-[11px] font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
              {isHindi ? 'भाषा चयन' : 'Select Language'}
            </span>
          </div>

          {/* SECTION 1: AVAILABLE LANGUAGES */}
          <div className="mt-2">
            <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--field-deep)]">
              {isHindi ? 'उपलब्ध भाषाएं' : 'AVAILABLE NOW'}
            </div>

            <div className="space-y-1">
              {/* English */}
              <button
                type="button"
                onClick={() => handleSelect(ENGLISH_LANGUAGE)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                  language === 'en'
                    ? 'bg-[var(--grain-tint)] font-semibold text-[var(--grain-deep)] border border-[var(--grain-tint)]'
                    : 'text-[var(--ink)] hover:bg-[var(--paper)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="font-medium">English</span>
                  <span className="text-[10px] text-[var(--ink-soft)]">(English)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="rounded-md bg-[var(--field-tint)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--field-deep)] border border-[var(--field-tint)]">
                    AVAILABLE
                  </span>
                  {language === 'en' && <Check size={13} className="text-[var(--grain-deep)]" />}
                </span>
              </button>

              {/* Hindi */}
              {SCHEDULED_INDIAN_LANGUAGES.filter((l) => l.code === 'hi').map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelect(l)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                    language === 'hi'
                      ? 'bg-[var(--grain-tint)] font-semibold text-[var(--grain-deep)] border border-[var(--grain-tint)]'
                      : 'text-[var(--ink)] hover:bg-[var(--paper)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{l.label}</span>
                    <span className="text-[10px] text-[var(--ink-soft)]">({l.english})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="rounded-md bg-[var(--field-tint)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--field-deep)] border border-[var(--field-tint)]">
                      AVAILABLE
                    </span>
                    {language === 'hi' && <Check size={13} className="text-[var(--grain-deep)]" />}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* DIVIDER */}
          <div className="my-2.5 border-t border-[var(--line)]" />

          {/* SECTION 2: 22 INDIAN LANGUAGES (EIGHTH SCHEDULE) */}
          <div>
            <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
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
                        ? 'bg-[var(--grain-tint)] font-semibold text-[var(--grain-deep)] border border-[var(--grain-tint)]'
                        : 'text-[var(--ink-soft)] hover:bg-[var(--paper)]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.label}</span>
                      <span className="text-[10px] text-[var(--ink-soft)]">({l.english})</span>
                    </span>

                    <span
                      className={`rounded px-1.5 py-0.5 text-[8px] font-medium tracking-wide ${
                        isAvail
                          ? 'bg-[var(--field-tint)] text-[var(--field-deep)] border border-[var(--field-tint)]'
                          : 'bg-[var(--paper)] text-[var(--ink-faint)] border border-[var(--line)]'
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
