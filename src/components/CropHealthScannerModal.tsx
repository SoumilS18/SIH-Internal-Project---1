import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Camera,
  Sparkles,
  Scan,
  ShieldCheck,
  CheckCircle2,
  Bug,
  Leaf,
  Droplets,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface CropHealthScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryCrop?: string;
}

export function CropHealthScannerModal({
  isOpen,
  onClose,
  primaryCrop = 'Crop',
}: CropHealthScannerModalProps) {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const [notified, setNotified] = useState(false);

  if (!isOpen) return null;

  return typeof document !== 'undefined' ? createPortal(
    <div
      className="scrim fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="panel-modal relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden p-6 text-[var(--ink)] sm:p-7 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--line)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--field-tint)] text-[var(--field-deep)] border border-[var(--field-tint)]">
                <Camera size={18} />
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[var(--ink)]">
                {isHi ? 'फसल स्वास्थ्य स्कैनर' : 'Crop Health Scanner'}
              </h2>
              <span className="chip chip-grain text-[10px] font-bold">
                {isHi ? 'शीघ्र आ रहा है' : 'Coming Soon'}
              </span>
            </div>
            <p className="text-xs font-medium text-[var(--ink-soft)]">
              {isHi
                ? 'स्मार्टफोन कैमरे से पत्ती का फोटो लें और AI द्वारा तुरंत रोग व कीट पहचानें।'
                : 'Capture or upload a crop leaf image for instant AI disease & pest diagnosis.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--line)] bg-[var(--surface-elevated)] p-2 text-[var(--ink-soft)] hover:bg-[var(--surface-inset)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            aria-label={isHi ? 'बंद करें' : 'Close'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewfinder Preview Visual */}
        <div className="mt-5 relative overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-gradient-to-b from-[var(--paper-3)] to-[var(--surface-inset)] p-5 text-center">
          <div className="relative mx-auto h-36 w-full max-w-xs rounded-xl border-2 border-dashed border-[var(--field-bright)]/40 bg-[var(--surface-solid)]/60 flex flex-col items-center justify-center p-4">
            {/* Viewfinder Corner Reticles */}
            <span className="absolute top-2 left-2 h-3.5 w-3.5 border-t-2 border-l-2 border-[var(--field)]" />
            <span className="absolute top-2 right-2 h-3.5 w-3.5 border-t-2 border-r-2 border-[var(--field)]" />
            <span className="absolute bottom-2 left-2 h-3.5 w-2.5 border-b-2 border-l-2 border-[var(--field)]" />
            <span className="absolute bottom-2 right-2 h-3.5 w-3.5 border-b-2 border-r-2 border-[var(--field)]" />

            <div className="relative flex flex-col items-center gap-2">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--field-tint)] text-[var(--field-deep)]">
                <Scan size={24} className="animate-pulse" />
              </div>
              <span className="text-xs font-semibold text-[var(--field-deep)]">
                {isHi ? 'AI विज़न डायग्नोस्टिक पूर्वावलोकन' : 'AI Vision Diagnostic Preview'}
              </span>
              <span className="text-[11px] text-[var(--ink-ghost)]">
                {isHi ? 'उच्च सटीकता ICAR पादप विकृति डेटाबेस' : 'Trained on ICAR Plant Pathology Repositories'}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Capabilities List */}
        <div className="mt-5 space-y-3">
          <h4 className="t-eyebrow text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
            {isHi ? 'शीघ्र उपलब्ध होने वाली क्षमताएं:' : 'UPCOMING CAPABILITIES:'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-3 space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-[var(--field)]">
                <Leaf size={14} />
                <span className="text-xs font-bold text-[var(--ink)]">
                  {isHi ? 'पत्ती रोग पहचान' : 'Disease Detection'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-soft)] leading-snug">
                {isHi ? 'झुलसा, फफूंद, जंग व मोज़ेक वायरस की 95%+ सटीक पहचान।' : 'Detects early blight, rust, mildew, and viral spots instantly.'}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-3 space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-[var(--risk)]">
                <Bug size={14} />
                <span className="text-xs font-bold text-[var(--ink)]">
                  {isHi ? 'कीट व लार्वा क्षति' : 'Pest Damage'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-soft)] leading-snug">
                {isHi ? 'सुंडी, माहू व चूसक कीटों की पहचान व जैविक उपचार।' : 'Identifies aphids, borers, whiteflies with organic remedies.'}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-3 space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-[var(--grain-deep)]">
                <Droplets size={14} />
                <span className="text-xs font-bold text-[var(--ink)]">
                  {isHi ? 'पोषक तत्व कमी' : 'Nutrient Deficit'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-soft)] leading-snug">
                {isHi ? 'नाइट्रोजन, जिंक व आयरन की कमी की स्पष्ट खुराक रिपोर्ट।' : 'Pinpoints N-P-K, Zinc, and Iron chlorosis with dosage advice.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
          <p className="text-[11px] text-[var(--ink-ghost)]">
            {isHi ? 'यह सुविधा आगामी अपडेट में सक्रिय होगी।' : 'This feature will be enabled in the upcoming update.'}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNotified(true)}
              disabled={notified}
              className={`btn btn-sm ${
                notified
                  ? 'btn-ghost border border-[var(--field)] text-[var(--field-deep)] font-semibold'
                  : 'btn-primary'
              }`}
            >
              {notified ? <CheckCircle2 size={13} /> : <Bell size={13} />}
              <span>
                {notified
                  ? (isHi ? 'अधिसूचना दर्ज है ✓' : 'Notification Set ✓')
                  : (isHi ? 'लॉन्च पर मुझे बताएं' : 'Notify Me When Live')}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm"
            >
              {isHi ? 'बंद करें' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;
}
