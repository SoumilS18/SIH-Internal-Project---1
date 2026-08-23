import React from 'react';
import { ShieldCheck, Activity, ChevronRight, Zap } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import type { AutonomousCycleLog, ProactiveAdvisory } from '@/types/autonomous';

interface AutonomousSentinelPillProps {
  latestLog: AutonomousCycleLog | null;
  advisory: ProactiveAdvisory | null;
  isChecking: boolean;
  onOpenLog: () => void;
  onRunCheck: () => void;
}

export function AutonomousSentinelPill({
  latestLog,
  advisory,
  isChecking,
  onOpenLog,
  onRunCheck,
}: AutonomousSentinelPillProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/70 via-forest-950/80 to-emerald-950/60 p-2.5 sm:px-4 sm:py-2 text-xs text-cream-100 shadow-sm backdrop-blur-md">
      {/* Left: Pulsing Sentinel Indicator & Status */}
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>

        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
          <span className="font-semibold text-emerald-300 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            {t('sentinel.statusActive')}
          </span>
          <span className="hidden sm:inline text-emerald-500/60">•</span>
          <span className="text-[11px] text-cream-300/80">
            {latestLog
              ? `${t('sentinel.lastCheck')}: ${latestLog.timestamp}`
              : t('sentinel.monitoring')}
          </span>
        </div>

        {latestLog?.monitoring_status === 'DEGRADED_TELEMETRY' && (
          <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
            {t('sentinel.telemetryFallback')}
          </span>
        )}

        {latestLog?.monitoring_status === 'CONDITION_UNCHANGED' && (
          <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
            ✓ {t('sentinel.conditionUnchanged')}
          </span>
        )}

        {latestLog?.monitoring_status === 'STRESS_RESOLVED' && (
          <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-emerald-500/25 border border-emerald-400/50 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
            ✓ {t('sentinel.stressResolved')}
          </span>
        )}

        {latestLog?.monitoring_status === 'ACTION_EXECUTED' && advisory && (
          <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            <Zap size={10} />
            {t('sentinel.actionExecuted')}
          </span>
        )}
      </div>

      {/* Right: Interactive Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRunCheck}
          disabled={isChecking}
          className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-900/60 px-2.5 py-1 text-[11px] font-medium text-emerald-200 hover:bg-emerald-800/80 hover:text-white transition-all disabled:opacity-50"
          title="Run immediate telemetry observation & validation cycle"
        >
          <Activity size={12} className={isChecking ? 'animate-spin' : ''} />
          <span>{isChecking ? t('sentinel.checking') : t('sentinel.runCheckNow')}</span>
        </button>

        <button
          type="button"
          onClick={onOpenLog}
          className="inline-flex items-center gap-1 rounded-full border border-gold-300/30 bg-forest-900/60 px-3 py-1 text-[11px] font-bold text-gold-300 hover:bg-forest-800 hover:text-gold-200 transition-all shadow-sm"
        >
          <span>{t('sentinel.viewLog')}</span>
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
