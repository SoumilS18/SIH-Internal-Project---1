/**
 * src/types/autonomous.ts
 * Type definitions for AgriOptima Autonomous Sentinel.
 * Strictly implements the OBSERVE -> REASON -> DECIDE -> VALIDATE -> ACT -> VERIFY -> MONITOR loop.
 * Bounded Autonomous Agricultural Decision Agent (Human-safe autonomous advisory agent).
 */

export type SentinelStatus =
  | 'monitoring'
  | 'analyzing'
  | 'action_executed'
  | 'condition_unchanged'
  | 'stress_resolved'
  | 'verified'
  | 'degraded'
  | 'error';

export type ActionType =
  | 'APPLY_PROACTIVE_ADVISORY'
  | 'UPDATE_ACTION_PRIORITY'
  | 'RECORD_OPTIMAL_STATUS';

export interface ActionValidationResult {
  is_approved: boolean;
  action_type: ActionType | string;
  reason: string;
  security_clearance: 'WHITELISTED_SAFE' | 'REJECTED_UNSAFE' | 'REQUIRES_HUMAN_APPROVAL';
}

export interface AutonomousAction {
  action_id: string;
  action_type: ActionType;
  title: string;
  description: string;
  target_crops: string[];
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  is_approved: boolean;
  validation_reason: string;
  timestamp: string;
}

export interface TelemetrySnapshot {
  soil_moisture_m3m3: number | null;
  forecast_rain_7d_mm: number | null;
  max_temp_c: number | null;
  drought_risk_score: number | null;
  waterlogging_risk_score: number | null;
  heat_risk_score: number | null;
  risk_level: string;
  allocated_crops: string[];
  missing_variables: string[];
}

export interface AutonomousCycleLog {
  cycle_id: string;
  fingerprint: string;
  timestamp: string;
  district: string;
  state: string;
  observation: string;
  reason: string;
  decision: string;
  action_type: ActionType;
  action_validated: boolean;
  action_name: string;
  action_detail: string;
  result: string;
  verification_status: 'VERIFIED' | 'REJECTED' | 'STANDBY' | 'FAILED';
  monitoring_status: 'ACTIVE_MONITORING' | 'ACTION_EXECUTED' | 'CONDITION_UNCHANGED' | 'STRESS_RESOLVED' | 'DEGRADED_TELEMETRY';
  state_changed: boolean;
  telemetry: TelemetrySnapshot;
}

export interface ProactiveAdvisory {
  id: string;
  fingerprint: string;
  headline: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  recommended_action: string;
  crop_impact: string;
  source: string;
  timestamp: string;
  action_required?: boolean;
  reason?: string;
}

