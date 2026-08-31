/**
 * src/types/planLifecycle.ts
 * Type definitions for the Live Progressive Farm Plan Execution Timeline
 * and Context-Aware Autonomous Sentinel Workflow.
 */

import type { DailyAction } from '@/lib/seasonalActionPlans';

export type PlanStatus =
  | 'NOT_STARTED'
  | 'ACTIVE'
  | 'ON_TRACK'
  | 'NEEDS_ATTENTION'
  | 'PLAN_UPDATED'
  | 'COMPLETED';

export interface TaskAdjustment {
  originalDay: number;
  newDay?: number;
  adjustedTitle?: string;
  adjustedDesc?: string;
  reason: string;
  actionTaken: 'postponed' | 'modified' | 'supplemented' | 'retained';
  timestamp: string;
  affectedDays?: number[];
  category?: 'prep' | 'sowing' | 'irrigation' | 'nutrient' | 'protection' | 'monitoring' | 'harvest';
}


export interface PlanExecutionState {
  isStarted: boolean;
  startDate: string | null; // ISO Date String e.g. "2026-08-30T00:00:00.000Z"
  lastActiveDate: string | null;
  currentStatus: PlanStatus;
  completedDays: number[]; // Day numbers confirmed completed by the farmer
  skippedDays: number[]; // Day numbers flagged as skipped or unperformed
  taskNotes: Record<number, string>; // Day number -> Farmer custom observation or note
  taskStatusMap: Record<number, 'pending' | 'completed' | 'delayed' | 'skipped'>;
  adjustments: Record<number, TaskAdjustment>;
}

export interface PlanProgressInfo {
  isStarted: boolean;
  startDate: Date | null;
  currentDay: number; // 1 to totalDays
  currentWeek: number; // 1 to totalWeeks
  totalDays: number;
  totalWeeks: number;
  isCompleted: boolean;
  todayTask: DailyAction | null;
  planStatus: PlanStatus;
  statusLabelEn: string;
  statusLabelHi: string;
}

export interface ContextualQuestion {
  id: string;
  label: { en: string; hi: string };
  category: 'task_completion' | 'soil_condition' | 'machinery' | 'weather' | 'input_quality' | 'pest_disease' | 'market';
  impactsAdjustment?: boolean;
}

export interface TaskSpecificChecklist {
  day: number;
  week: number;
  taskTitle: string;
  taskCategory: DailyAction['category'];
  questions: ContextualQuestion[];
}

export interface PlanReasoningContext {
  isStarted: boolean;
  currentDay: number;
  currentWeek: number;
  totalDays: number;
  totalWeeks: number;
  todayTask: DailyAction | null;
  primaryCrop: string;
  allocatedCrops: string[];
  planStatus: PlanStatus;
  farmerObservations: string[];
  customReportText?: string;
}
