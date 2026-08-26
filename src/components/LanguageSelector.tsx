import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import {
  ENGLISH_LANGUAGE,
  SCHEDULED_INDIAN_LANGUAGES,
  LanguageOption,
} from '@/i18n/languages';
import { useLanguage } from '@/i18n/LanguageContext';

export function LanguageSelector({ className = '', align = 'auto' }: { className?: string; align?: 'left' | 'right' | 'auto' }) {
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
        className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE4D5] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#1F2937] shadow-xs transition-all hover:border-[#D1D5DB] hover:bg-[#FAF7F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2725B]/40 cursor-pointer"
      >
        <Globe size={13} className="text-[#E2725B]" />
        <span className="font-sans font-medium">{languageOption.label}</span>
        <ChevronDown size={11} className={`text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Menu (Guaranteed Viewport Safe) */}
      {isOpen && (
        <div
          className={`absolute ${
            computedAlign === 'left' ? 'left-0' : 'right-0'
          } top-full z-50 mt-2 max-h-[min(420px,75vh)] w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-2.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-[#1F2937] overscroll-contain`}
          role="listbox"
          aria-label="Select Language"
        >
          {/* Header */}
          <div className="border-b border-[#EDE4D5] px-2.5 pb-2 pt-1">
            <span className="font-serif text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
              {isHindi ? 'भाषा चयन' : 'Select Language'}
            </span>
          </div>

          {/* SECTION 1: AVAILABLE LANGUAGES */}
          <div className="mt-2">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2D5A43]">
              {isHindi ? 'उपलब्ध भाषाएं' : 'AVAILABLE NOW'}
            </div>

            <div className="space-y-1">
              {/* English */}
              <button
                type="button"
                onClick={() => handleSelect(ENGLISH_LANGUAGE)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                  language === 'en'
                    ? 'bg-[#FDEEE9] font-bold text-[#E2725B] border border-[#F9D0C5]'
                    : 'text-[#1F2937] hover:bg-[#FAF7F2]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">English</span>
                  <span className="text-[10px] text-[#6B7280]">(English)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-md bg-[#EAF3ED] px-1.5 py-0.5 text-[9px] font-semibold text-[#2D5A43] border border-[#D4E7DC]">
                    AVAILABLE
                  </span>
                  {language === 'en' && <Check size={13} className="text-[#E2725B]" />}
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
                      ? 'bg-[#FDEEE9] font-bold text-[#E2725B] border border-[#F9D0C5]'
                      : 'text-[#1F2937] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{l.label}</span>
                    <span className="text-[10px] text-[#6B7280]">({l.english})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-[#EAF3ED] px-1.5 py-0.5 text-[9px] font-semibold text-[#2D5A43] border border-[#D4E7DC]">
                      AVAILABLE
                    </span>
                    {language === 'hi' && <Check size={13} className="text-[#E2725B]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* DIVIDER */}
          <div className="my-2.5 border-t border-[#EDE4D5]" />

          {/* SECTION 2: 22 INDIAN LANGUAGES (EIGHTH SCHEDULE) */}
          <div>
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
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
                        ? 'bg-[#FDEEE9] font-bold text-[#E2725B] border border-[#F9D0C5]'
                        : 'text-[#374151] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{l.label}</span>
                      <span className="text-[10px] text-[#6B7280]">({l.english})</span>
                    </div>

                    <span
                      className={`rounded px-1.5 py-0.5 text-[8px] font-medium tracking-wide ${
                        isAvail
                          ? 'bg-[#EAF3ED] text-[#2D5A43] border border-[#D4E7DC]'
                          : 'bg-[#FAF7F2] text-[#9CA3AF] border border-[#EDE4D5]'
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
