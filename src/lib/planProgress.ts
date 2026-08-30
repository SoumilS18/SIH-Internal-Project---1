/**
 * src/lib/planProgress.ts
 * Real-Time Progressive Execution Engine for AgriOptima Farm Plans.
 * Handles calendar day calculation, state persistence, and task lifecycles.
 */

import type {
  PlanStatus,
  PlanExecutionState,
  PlanProgressInfo,
} from '@/types/planLifecycle';
import {
  getSeasonWeeksCount,
  getWeeklyActionPlan,
  type DailyAction,
} from './seasonalActionPlans';

export const PLAN_LIFECYCLE_STORAGE_KEY = 'agrioptima_plan_lifecycle_v1';

export const DEFAULT_PLAN_EXECUTION_STATE: PlanExecutionState = {
  isStarted: false,
  startDate: null,
  lastActiveDate: null,
  currentStatus: 'NOT_STARTED',
  completedDays: [],
  skippedDays: [],
  taskNotes: {},
  taskStatusMap: {},
  adjustments: {},
};

/**
 * Loads the stored plan execution state from localStorage with safe fallback.
 */
export function loadPlanExecutionState(keySuffix?: string): PlanExecutionState {
  try {
    const storageKey = keySuffix
      ? `${PLAN_LIFECYCLE_STORAGE_KEY}_${keySuffix}`
      : PLAN_LIFECYCLE_STORAGE_KEY;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { ...DEFAULT_PLAN_EXECUTION_STATE };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        isStarted: Boolean(parsed.isStarted),
        startDate: typeof parsed.startDate === 'string' ? parsed.startDate : null,
        lastActiveDate: typeof parsed.lastActiveDate === 'string' ? parsed.lastActiveDate : null,
        currentStatus: parsed.currentStatus || (parsed.isStarted ? 'ACTIVE' : 'NOT_STARTED'),
        completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays : [],
        skippedDays: Array.isArray(parsed.skippedDays) ? parsed.skippedDays : [],
        taskNotes: parsed.taskNotes && typeof parsed.taskNotes === 'object' ? parsed.taskNotes : {},
        taskStatusMap: parsed.taskStatusMap && typeof parsed.taskStatusMap === 'object' ? parsed.taskStatusMap : {},
        adjustments: parsed.adjustments && typeof parsed.adjustments === 'object' ? parsed.adjustments : {},
      };
    }
  } catch (err) {
    console.warn('Could not restore plan execution state from storage:', err);
  }
  return { ...DEFAULT_PLAN_EXECUTION_STATE };
}

/**
 * Persists the plan execution state to localStorage.
 */
export function savePlanExecutionState(
  state: PlanExecutionState,
  keySuffix?: string
): void {
  try {
    const storageKey = keySuffix
      ? `${PLAN_LIFECYCLE_STORAGE_KEY}_${keySuffix}`
      : PLAN_LIFECYCLE_STORAGE_KEY;
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (err) {
    console.warn('Could not save plan execution state:', err);
  }
}

/**
 * Computes the dynamic calendar progress from the plan's start date.
 */
export function calculatePlanProgress(
  state: PlanExecutionState,
  season: 'Kharif' | 'Rabi' | 'Zaid',
  cropNames?: string[],
  language: 'en' | 'hi' = 'en'
): PlanProgressInfo {
  const totalWeeks = getSeasonWeeksCount(season);
  const totalDays = totalWeeks * 7;
  const isHi = language === 'hi';

  if (!state.isStarted || !state.startDate) {
    const week1Plan = getWeeklyActionPlan(season, 1, language, cropNames);
    const day1Action = week1Plan.days[0] || null;

    return {
      isStarted: false,
      startDate: null,
      currentDay: 1,
      currentWeek: 1,
      totalDays,
      totalWeeks,
      isCompleted: false,
      todayTask: day1Action,
      planStatus: 'NOT_STARTED',
      statusLabelEn: 'Not Started (Preview)',
      statusLabelHi: 'शुरू नहीं हुई (पूर्वावलोकन)',
    };
  }

  const start = new Date(state.startDate);
  const now = new Date();

  // Strip time components to calculate exact calendar day difference
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const diffMs = nowMidnight - startMidnight;
  const dayDelta = Math.floor(diffMs / (1000 * 60 * 60 * 24)); // 0 on start date

  const currentDay = Math.max(1, Math.min(totalDays, dayDelta + 1));
  const currentWeek = Math.max(1, Math.min(totalWeeks, Math.floor((currentDay - 1) / 7) + 1));
  const isCompleted = dayDelta + 1 > totalDays;

  // Retrieve today's scheduled task
  const weekPlan = getWeeklyActionPlan(season, currentWeek, language, cropNames);
  const dayIndexInWeek = (currentDay - 1) % 7;
  const todayTask = weekPlan.days[dayIndexInWeek] || weekPlan.days[0] || null;

  // Derive human status labels
  let status: PlanStatus = state.currentStatus;
  if (isCompleted) {
    status = 'COMPLETED';
  } else if (status === 'NOT_STARTED') {
    status = 'ACTIVE';
  }

  const statusMap: Record<PlanStatus, { en: string; hi: string }> = {
    NOT_STARTED: { en: 'Not Started', hi: 'शुरू नहीं हुई' },
    ACTIVE: { en: 'Active', hi: 'सक्रिय' },
    ON_TRACK: { en: 'On Track', hi: 'समय पर जारी' },
    NEEDS_ATTENTION: { en: 'Needs Attention', hi: 'ध्यान देने योग्य' },
    PLAN_UPDATED: { en: 'Plan Adjusted', hi: 'योजना समायोजित' },
    COMPLETED: { en: 'Completed', hi: 'सफलतापूर्वक संपन्न' },
  };

  return {
    isStarted: true,
    startDate: start,
    currentDay,
    currentWeek,
    totalDays,
    totalWeeks,
    isCompleted,
    todayTask,
    planStatus: status,
    statusLabelEn: statusMap[status]?.en || 'Active',
    statusLabelHi: statusMap[status]?.hi || 'सक्रिय',
  };
}

/**
 * Initializes and starts the plan execution from today.
 */
export function startPlanExecution(
  currentState: PlanExecutionState
): PlanExecutionState {
  const nowIso = new Date().toISOString();
  return {
    ...currentState,
    isStarted: true,
    startDate: nowIso,
    lastActiveDate: nowIso,
    currentStatus: 'ACTIVE',
  };
}

/**
 * Toggles a day's completion state (recorded upon farmer confirmation).
 */
export function toggleTaskCompletion(
  currentState: PlanExecutionState,
  dayNumber: number
): PlanExecutionState {
  const isDone = currentState.completedDays.includes(dayNumber);
  const newCompleted = isDone
    ? currentState.completedDays.filter((d) => d !== dayNumber)
    : [...currentState.completedDays, dayNumber];

  const newStatusMap = { ...currentState.taskStatusMap };
  newStatusMap[dayNumber] = isDone ? 'pending' : 'completed';

  return {
    ...currentState,
    completedDays: newCompleted,
    taskStatusMap: newStatusMap,
    lastActiveDate: new Date().toISOString(),
  };
}
