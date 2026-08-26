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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-[#EDE4D5] bg-[#FAF7F2] p-5 sm:p-6 text-[#1F2937] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EDE4D5] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#2D5A43] border border-[#D4E7DC]">
                <ShieldCheck size={16} />
              </span>
              <h2 className="font-serif text-lg font-bold text-[#1F2937]">
                {t('sentinel.modalTitle')}
              </h2>
            </div>
            <p className="text-xs font-medium text-[#6B7280]">
              {t('sentinel.modalSubtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#EDE4D5] bg-[#FFFFFF] p-2 text-[#6B7280] hover:bg-[#F5EFE6] hover:text-[#1F2937] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Safety Boundary Banner */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#D4E7DC] bg-[#EAF3ED] px-3.5 py-2 text-xs text-[#2D5A43]">
          <button
            type="button"
            onClick={() => setShowSecurityDetails((prev) => !prev)}
            className="flex items-center gap-1.5 font-bold hover:underline text-left cursor-pointer"
          >
            <Lock size={13} className="text-[#3F7253] shrink-0" />
            <span>{t('sentinel.securityBadge')}</span>
          </button>

          <button
            type="button"
            onClick={onRunCheck}
            disabled={isChecking}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D5A43] px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-[#224432] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Activity size={12} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? t('sentinel.checking') : t('sentinel.runCheckNow')}</span>
          </button>
        </div>

        {/* Security Whitelist Details Drawer */}
        {showSecurityDetails && (
          <div className="mt-2.5 rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 space-y-2.5 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="text-[#2D5A43] font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} /> {t('sentinel.allowedActionsTitle')}
            </div>
            <ul className="list-disc pl-5 text-[#374151] space-y-0.5 text-[11px]">
              <li>APPLY_PROACTIVE_ADVISORY (Field directives, irrigation/drainage alerts)</li>
              <li>UPDATE_ACTION_PRIORITY (Dynamic prioritization of seasonal operations)</li>
              <li>RECORD_OPTIMAL_STATUS (Verification clearance logging)</li>
            </ul>

            <div className="text-[#B54832] font-bold flex items-center gap-1.5 pt-1">
              <ShieldAlert size={14} /> {t('sentinel.blockedActionsTitle')}
            </div>
            <ul className="list-disc pl-5 text-[#374151] space-y-0.5 text-[11px]">
              <li>Purchasing agricultural inputs (Chemicals, pesticides, seeds)</li>
              <li>Financial transfers, budget modifications, or mandi orders</li>
              <li>Arbitrary code/shell execution or deleting farmer telemetry records</li>
            </ul>
          </div>
        )}

        {/* Event Selector Strip (if multiple logs in bounded buffer) */}
        {logs.length > 1 && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[#6B7280] font-semibold flex items-center gap-1 shrink-0 text-[11px]">
              <History size={12} /> {isHi ? 'इतिहास' : 'History'} ({logs.length}):
            </span>
            {logs.slice(0, 8).map((logItem, idx) => (
              <button
                key={logItem.cycle_id + idx}
                type="button"
                onClick={() => setSelectedLogIndex(idx)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium shrink-0 transition-colors cursor-pointer ${
                  selectedLogIndex === idx
                    ? 'bg-[#E2725B] text-white font-bold shadow-xs'
                    : 'bg-[#FFFFFF] border border-[#EDE4D5] text-[#6B7280] hover:text-[#1F2937]'
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
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE4D5] pb-2 text-[11px] text-[#6B7280]">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {currentLog.timestamp} • {currentLog.district}, {currentLog.state} (ID: {currentLog.cycle_id})
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold border text-[10px] ${
                    currentLog.verification_status === 'VERIFIED'
                      ? 'bg-[#EAF3ED] text-[#2D5A43] border-[#D4E7DC]'
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
              <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-[#E2725B] font-bold text-xs uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Activity size={14} className="text-[#E2725B]" />
                    {t('sentinel.stepObserve')}
                  </span>
                </div>
                <p className="text-[#374151] leading-relaxed">{currentLog.observation}</p>
                {/* Telemetry Pills */}
                <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#FAF7F2] border border-[#EDE4D5] px-2.5 py-1 font-semibold text-[#2D5A43]">
                    <Droplets size={12} />
                    {currentLog.telemetry.soil_moisture_m3m3 !== null
                      ? `${currentLog.telemetry.soil_moisture_m3m3.toFixed(2)} m³/m³`
                      : 'Soil Moisture: N/A'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#FAF7F2] border border-[#EDE4D5] px-2.5 py-1 font-semibold text-[#2563EB]">
                    <CloudRain size={12} />
                    {currentLog.telemetry.forecast_rain_7d_mm !== null
                      ? `${formatRainfall(currentLog.telemetry.forecast_rain_7d_mm, language)} (7d)`
                      : 'Rain 7d: N/A'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#FAF7F2] border border-[#EDE4D5] px-2.5 py-1 font-semibold text-[#D97706]">
                    <Sun size={12} />
                    {currentLog.telemetry.max_temp_c !== null
                      ? `${formatTemperature(currentLog.telemetry.max_temp_c, language)} max`
                      : 'Temp: N/A'}
                  </span>
                </div>
              </div>

              {/* 2. REASON */}
              <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 space-y-1.5 shadow-xs">
                <div className="text-[#2D5A43] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#3F7253]" />
                  {t('sentinel.stepReason')}
                </div>
                <p className="text-[#374151] leading-relaxed">{currentLog.reason}</p>
              </div>

              {/* 3. DECIDE & 4. VALIDATE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 space-y-1.5 shadow-xs">
                  <div className="text-[#B54832] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} className="text-[#E2725B]" />
                    {t('sentinel.stepDecide')}
                  </div>
                  <p className="text-[#1F2937] font-semibold">{currentLog.decision}</p>
                </div>

                <div className="rounded-2xl border border-[#D4E7DC] bg-[#EAF3ED] p-4 space-y-1.5 shadow-xs">
                  <div className="text-[#2D5A43] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#3F7253]" />
                    {t('sentinel.stepValidate')}
                  </div>
                  <p className="text-[#2D5A43] text-xs font-bold">
                    ✓ {currentLog.action_validated ? 'APPROVED: Whitelisted Safe' : 'REJECTED: Security Boundary'}
                  </p>
                </div>
              </div>

              {/* 5. ACT */}
              <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 space-y-1.5 shadow-xs">
                <div className="text-[#2A7575] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={14} className="text-[#2A7575]" />
                  {t('sentinel.stepAct')}
                </div>
                <p className="text-[#1F2937] font-bold">{currentLog.action_name}</p>
                <p className="text-[#6B7280] text-xs">{currentLog.action_detail}</p>
              </div>

              {/* 6. VERIFY */}
              <div
                className={`rounded-2xl border p-4 space-y-1.5 shadow-xs ${
                  currentLog.verification_status === 'VERIFIED'
                    ? 'border-[#D4E7DC] bg-[#EAF3ED]'
                    : 'border-[#FECDD3] bg-[#FFF1F2]'
                }`}
              >
                <div
                  className={`font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                    currentLog.verification_status === 'VERIFIED' ? 'text-[#2D5A43]' : 'text-[#BE123C]'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  {t('sentinel.stepVerify')}
                </div>
                <p
                  className={`leading-relaxed font-semibold ${
                    currentLog.verification_status === 'VERIFIED' ? 'text-[#1F2937]' : 'text-[#9F1239]'
                  }`}
                >
                  {currentLog.result}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[#6B7280]">
              {t('sentinel.emptyLogs')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end border-t border-[#EDE4D5] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#2D5A43] px-5 py-2 text-xs font-bold text-white hover:bg-[#224432] transition-colors cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
