import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Activity,
  Droplets,
  CloudRain,
  Sun,
  CheckCircle2,
  Lock,
  Zap,
  Clock,
  Sparkles,
  ShieldAlert,
  History,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { AutonomousCycleLog, ProactiveAdvisory } from '@/types/autonomous';
import { formatTemperature, formatRainfall } from '@/i18n/formatters';

interface AutonomousLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AutonomousCycleLog[];
  advisory: ProactiveAdvisory | null;
  onRunCheck: () => void;
  isChecking: boolean;
}

export function AutonomousLogModal({
  isOpen,
  onClose,
  logs,
  advisory,
  onRunCheck,
  isChecking,
}: AutonomousLogModalProps) {
  const { t, language } = useLanguage();
  const isHi = language === 'hi';
  const [selectedLogIndex, setSelectedLogIndex] = useState<number>(0);
  const [showSecurityDetails, setShowSecurityDetails] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentLog = logs[selectedLogIndex] || logs[0] || null;

  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="panel-modal relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden p-5 text-[var(--ink)] sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--line)] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--field-tint)] text-[var(--field-deep)] border border-[var(--field-tint)]">
                <ShieldCheck size={16} />
              </span>
              <h2 className="font-serif text-lg font-semibold text-[var(--ink)]">
                {t('sentinel.modalTitle')}
              </h2>
            </div>
            <p className="text-xs font-medium text-[var(--ink-soft)]">
              {t('sentinel.modalSubtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--line)] bg-[var(--surface-elevated)] p-2 text-[var(--ink-soft)] hover:bg-[var(--paper-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Safety Boundary Banner */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--field-tint)] bg-[var(--field-tint)] px-3.5 py-2 text-xs text-[var(--field-deep)]">
          <button
            type="button"
            onClick={() => setShowSecurityDetails((prev) => !prev)}
            className="flex items-center gap-1.5 font-semibold hover:underline text-left cursor-pointer"
          >
            <Lock size={13} className="text-[var(--field)] shrink-0" />
            <span>{t('sentinel.securityBadge')}</span>
          </button>

          <button
            type="button"
            onClick={onRunCheck}
            disabled={isChecking}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--field-deep)] px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-[var(--field-deep)] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Activity size={12} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? t('sentinel.checking') : t('sentinel.runCheckNow')}</span>
          </button>
        </div>

        {/* Security Whitelist Details Drawer */}
        {showSecurityDetails && (
          <div className="mt-2.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 space-y-2.5 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="text-[var(--field-deep)] font-semibold flex items-center gap-1.5">
              <ShieldCheck size={14} /> {t('sentinel.allowedActionsTitle')}
            </div>
            <ul className="list-disc pl-5 text-[var(--ink-soft)] space-y-0.5 text-[11px]">
              <li>APPLY_PROACTIVE_ADVISORY (Field directives, irrigation/drainage alerts)</li>
              <li>UPDATE_ACTION_PRIORITY (Dynamic prioritization of seasonal operations)</li>
              <li>RECORD_OPTIMAL_STATUS (Verification clearance logging)</li>
            </ul>

            <div className="text-[var(--grain-deep)] font-semibold flex items-center gap-1.5 pt-1">
              <ShieldAlert size={14} /> {t('sentinel.blockedActionsTitle')}
            </div>
            <ul className="list-disc pl-5 text-[var(--ink-soft)] space-y-0.5 text-[11px]">
              <li>Purchasing agricultural inputs (Chemicals, pesticides, seeds)</li>
              <li>Financial transfers, budget modifications, or mandi orders</li>
              <li>Arbitrary code/shell execution or deleting farmer telemetry records</li>
            </ul>
          </div>
        )}

        {/* Event Selector Strip (if multiple logs in bounded buffer) */}
        {logs.length > 1 && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[var(--ink-soft)] font-semibold flex items-center gap-1 shrink-0 text-[11px]">
              <History size={12} /> {isHi ? 'इतिहास' : 'History'} ({logs.length}):
            </span>
            {logs.slice(0, 8).map((logItem, idx) => (
              <button
                key={logItem.cycle_id + idx}
                type="button"
                onClick={() => setSelectedLogIndex(idx)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium shrink-0 transition-colors cursor-pointer ${
                  selectedLogIndex === idx
                    ? 'bg-[var(--field)] text-white font-semibold shadow-xs'
                    : 'bg-[var(--surface-elevated)] border border-[var(--line)] text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                {logItem.timestamp}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Lifecycle Content */}
        <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1 text-xs">
          {currentLog ? (
            <div className="space-y-3">
              {/* Event Provenance Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2 text-[11px] text-[var(--ink-soft)]">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {currentLog.timestamp} • {currentLog.district}, {currentLog.state} (ID: {currentLog.cycle_id})
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold border text-[10px] ${
                    currentLog.verification_status === 'VERIFIED'
                      ? 'bg-[var(--field-tint)] text-[var(--field-deep)] border-[var(--field-tint)]'
                      : currentLog.verification_status === 'FAILED'
                      ? 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]'
                      : 'bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]'
                  }`}
                >
                  <CheckCircle2 size={11} />
                  {currentLog.verification_status}
                </span>
              </div>

              {/* 1. OBSERVE */}
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-[var(--grain-deep)] font-semibold text-xs uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Activity size={14} className="text-[var(--grain-deep)]" />
                    {t('sentinel.stepObserve')}
                  </span>
                </div>
                <p className="text-[var(--ink-soft)] leading-relaxed">{currentLog.observation}</p>
                {/* Telemetry Pills */}
                <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--paper)] border border-[var(--line)] px-2.5 py-1 font-semibold text-[var(--field-deep)]">
                    <Droplets size={12} />
                    {currentLog.telemetry.soil_moisture_m3m3 !== null
                      ? `${currentLog.telemetry.soil_moisture_m3m3.toFixed(2)} m³/m³`
                      : 'Soil Moisture: N/A'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--paper)] border border-[var(--line)] px-2.5 py-1 font-semibold text-[#2563EB]">
                    <CloudRain size={12} />
                    {currentLog.telemetry.forecast_rain_7d_mm !== null
                      ? `${formatRainfall(currentLog.telemetry.forecast_rain_7d_mm, language)} (7d)`
                      : 'Rain 7d: N/A'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--paper)] border border-[var(--line)] px-2.5 py-1 font-semibold text-[#D97706]">
                    <Sun size={12} />
                    {currentLog.telemetry.max_temp_c !== null
                      ? `${formatTemperature(currentLog.telemetry.max_temp_c, language)} max`
                      : 'Temp: N/A'}
                  </span>
                </div>
              </div>

              {/* 2. REASON */}
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 space-y-1.5 shadow-xs">
                <div className="text-[var(--field-deep)] font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[var(--field)]" />
                  {t('sentinel.stepReason')}
                </div>
                <p className="text-[var(--ink-soft)] leading-relaxed">{currentLog.reason}</p>
              </div>

              {/* 3. DECIDE & 4. VALIDATE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 space-y-1.5 shadow-xs">
                  <div className="text-[var(--grain-deep)] font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} className="text-[var(--grain-deep)]" />
                    {t('sentinel.stepDecide')}
                  </div>
                  <p className="text-[var(--ink)] font-semibold">{currentLog.decision}</p>
                </div>

                <div className="rounded-2xl border border-[var(--field-tint)] bg-[var(--field-tint)] p-4 space-y-1.5 shadow-xs">
                  <div className="text-[var(--field-deep)] font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[var(--field)]" />
                    {t('sentinel.stepValidate')}
                  </div>
                  <p className="text-[var(--field-deep)] text-xs font-semibold">
                    ✓ {currentLog.action_validated ? 'APPROVED: Whitelisted Safe' : 'REJECTED: Security Boundary'}
                  </p>
                </div>
              </div>

              {/* 5. ACT */}
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 space-y-1.5 shadow-xs">
                <div className="text-[var(--sky)] font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={14} className="text-[var(--sky)]" />
                  {t('sentinel.stepAct')}
                </div>
                <p className="text-[var(--ink)] font-semibold">{currentLog.action_name}</p>
                <p className="text-[var(--ink-soft)] text-xs">{currentLog.action_detail}</p>
              </div>

              {/* 6. VERIFY */}
              <div
                className={`rounded-2xl border p-4 space-y-1.5 shadow-xs ${
                  currentLog.verification_status === 'VERIFIED'
                    ? 'border-[var(--field-tint)] bg-[var(--field-tint)]'
                    : 'border-[#FECDD3] bg-[#FFF1F2]'
                }`}
              >
                <div
                  className={`font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                    currentLog.verification_status === 'VERIFIED' ? 'text-[var(--field-deep)]' : 'text-[#BE123C]'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  {t('sentinel.stepVerify')}
                </div>
                <p
                  className={`leading-relaxed font-semibold ${
                    currentLog.verification_status === 'VERIFIED' ? 'text-[var(--ink)]' : 'text-[#9F1239]'
                  }`}
                >
                  {currentLog.result}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[var(--ink-soft)]">
              {t('sentinel.emptyLogs')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end border-t border-[var(--line)] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--field-deep)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--field-deep)] transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
