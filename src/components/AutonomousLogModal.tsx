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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-gold-300/30 bg-gradient-to-b from-forest-900/95 via-forest-950/95 to-forest-950 p-5 sm:p-6 text-cream-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gold-300/15 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <ShieldCheck size={16} />
              </span>
              <h2 className="font-serif text-lg font-bold text-gold-100">
                {t('sentinel.modalTitle')}
              </h2>
            </div>
            <p className="text-xs font-medium text-cream-300/70 font-mono tracking-wide">
              {t('sentinel.modalSubtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-forest-700/60 bg-forest-950/80 p-1.5 text-cream-300/80 hover:bg-forest-800 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Safety Boundary Banner */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-[11px] text-emerald-200">
          <button
            type="button"
            onClick={() => setShowSecurityDetails((prev) => !prev)}
            className="flex items-center gap-1.5 font-medium hover:underline text-left"
          >
            <Lock size={13} className="text-emerald-400 shrink-0" />
            <span>{t('sentinel.securityBadge')}</span>
          </button>

          <button
            type="button"
            onClick={onRunCheck}
            disabled={isChecking}
            className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-800/60 px-2.5 py-0.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            <Activity size={11} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? t('sentinel.checking') : t('sentinel.runCheckNow')}</span>
          </button>
        </div>

        {/* Security Whitelist Details Drawer */}
        {showSecurityDetails && (
          <div className="mt-2.5 rounded-2xl border border-forest-800 bg-forest-950/90 p-3.5 space-y-2 text-[11px] font-mono animate-in slide-in-from-top-2 duration-150">
            <div className="text-emerald-300 font-bold flex items-center gap-1">
              <ShieldCheck size={12} /> {t('sentinel.allowedActionsTitle')}
            </div>
            <ul className="list-disc pl-4 text-emerald-200/90 space-y-0.5">
              <li>APPLY_PROACTIVE_ADVISORY (Field directives, irrigation/drainage alerts)</li>
              <li>UPDATE_ACTION_PRIORITY (Dynamic prioritization of seasonal operations)</li>
              <li>RECORD_OPTIMAL_STATUS (Verification clearance logging)</li>
            </ul>

            <div className="text-pink-300 font-bold flex items-center gap-1 pt-1">
              <ShieldAlert size={12} /> {t('sentinel.blockedActionsTitle')}
            </div>
            <ul className="list-disc pl-4 text-pink-200/90 space-y-0.5">
              <li>Purchasing agricultural inputs (Chemicals, pesticides, seeds)</li>
              <li>Financial transfers, budget modifications, or mandi orders</li>
              <li>Arbitrary code/shell execution or deleting farmer telemetry records</li>
            </ul>
          </div>
        )}

        {/* Event Selector Strip (if multiple logs in bounded buffer) */}
        {logs.length > 1 && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[10px]">
            <span className="text-cream-300/60 flex items-center gap-1 shrink-0 font-mono">
              <History size={11} /> History ({logs.length}):
            </span>
            {logs.slice(0, 8).map((logItem, idx) => (
              <button
                key={logItem.cycle_id + idx}
                type="button"
                onClick={() => setSelectedLogIndex(idx)}
                className={`rounded-lg px-2 py-0.5 font-mono shrink-0 transition-colors ${
                  selectedLogIndex === idx
                    ? 'bg-gold-400 text-forest-950 font-bold'
                    : 'bg-forest-900/80 text-cream-300/70 hover:text-white'
                }`}
              >
                {logItem.timestamp}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Lifecycle Content */}
        <div className="mt-3 flex-1 space-y-3.5 overflow-y-auto pr-1 text-xs">
          {currentLog ? (
            <div className="space-y-3">
              {/* Event Provenance Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-forest-800/80 pb-2 text-[11px] text-cream-300/60">
                <span className="flex items-center gap-1 font-mono">
                  <Clock size={12} /> {currentLog.timestamp} • {currentLog.district}, {currentLog.state} (ID: {currentLog.cycle_id})
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold border ${
                    currentLog.verification_status === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : currentLog.verification_status === 'FAILED'
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <CheckCircle2 size={11} />
                  {currentLog.verification_status}
                </span>
              </div>

              {/* 1. OBSERVE */}
              <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-gold-300 font-bold text-[11px] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Activity size={13} className="text-gold-400" />
                    {t('sentinel.stepObserve')}
                  </span>
                </div>
                <p className="text-cream-200 leading-relaxed">{currentLog.observation}</p>
                {/* Telemetry Pills (Honest declaration of verified numbers) */}
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-forest-950/80 border border-forest-700/50 px-2 py-1 text-cyan-300">
                    <Droplets size={11} />
                    {currentLog.telemetry.soil_moisture_m3m3 !== null
                      ? `${currentLog.telemetry.soil_moisture_m3m3.toFixed(2)} m³/m³`
                      : 'Soil Moisture: N/A'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-forest-950/80 border border-forest-700/50 px-2 py-1 text-blue-300">
                    <CloudRain size={11} />
                    {currentLog.telemetry.forecast_rain_7d_mm !== null
                      ? `${formatRainfall(currentLog.telemetry.forecast_rain_7d_mm, language)} (7d)`
                      : 'Rain 7d: N/A'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-forest-950/80 border border-forest-700/50 px-2 py-1 text-amber-300">
                    <Sun size={11} />
                    {currentLog.telemetry.max_temp_c !== null
                      ? `${formatTemperature(currentLog.telemetry.max_temp_c, language)} max`
                      : 'Temp: N/A'}
                  </span>
                </div>
              </div>

              {/* 2. REASON */}
              <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-3.5 space-y-1.5">
                <div className="text-amber-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-400" />
                  {t('sentinel.stepReason')}
                </div>
                <p className="text-cream-200 leading-relaxed">{currentLog.reason}</p>
              </div>

              {/* 3. DECIDE & 4. VALIDATE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-3.5 space-y-1.5">
                  <div className="text-gold-200 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={13} className="text-gold-300" />
                    {t('sentinel.stepDecide')}
                  </div>
                  <p className="text-cream-100 font-medium">{currentLog.decision}</p>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 space-y-1.5">
                  <div className="text-emerald-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-400" />
                    {t('sentinel.stepValidate')}
                  </div>
                  <p className="text-emerald-200 text-[11px] font-mono">
                    ✓ {currentLog.action_validated ? 'APPROVED: Whitelisted Safe' : 'REJECTED: Security Boundary'}
                  </p>
                </div>
              </div>

              {/* 5. ACT */}
              <div className="rounded-2xl border border-forest-800 bg-forest-900/60 p-3.5 space-y-1.5">
                <div className="text-cyan-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={13} className="text-cyan-400" />
                  {t('sentinel.stepAct')}
                </div>
                <p className="text-cream-100 font-semibold">{currentLog.action_name}</p>
                <p className="text-cream-300/80 text-[11px]">{currentLog.action_detail}</p>
              </div>

              {/* 6. VERIFY */}
              <div
                className={`rounded-2xl border p-3.5 space-y-1.5 ${
                  currentLog.verification_status === 'VERIFIED'
                    ? 'border-emerald-500/40 bg-emerald-950/40'
                    : 'border-pink-500/40 bg-pink-950/40'
                }`}
              >
                <div
                  className={`font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                    currentLog.verification_status === 'VERIFIED' ? 'text-emerald-300' : 'text-pink-300'
                  }`}
                >
                  <CheckCircle2 size={13} />
                  {t('sentinel.stepVerify')}
                </div>
                <p
                  className={`leading-relaxed font-medium ${
                    currentLog.verification_status === 'VERIFIED' ? 'text-emerald-100' : 'text-pink-200'
                  }`}
                >
                  {currentLog.result}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-cream-300/60">
              {t('sentinel.emptyLogs')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 flex justify-end border-t border-gold-300/15 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gold-300/30 bg-forest-900 px-5 py-1.5 text-xs font-bold text-cream-100 hover:bg-forest-800 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
