/**
 * src/lib/planProgress.ts
 * Real-Time Progressive Execution Engine for AgriOptima Farm Plans.
 * Handles calendar day calculation, state persistence, and task lifecycles.
 */

export type {
  PlanStatus,
  PlanExecutionState,
  PlanProgressInfo,
  TaskAdjustment,
} from '@/types/planLifecycle';
import type { TaskAdjustment, PlanStatus, PlanExecutionState, PlanProgressInfo } from '@/types/planLifecycle';
import {
  getSeasonWeeksCount,
  getWeeklyActionPlan,
  type DailyAction,
  type WeekPlan,
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
 * Dynamically localizes task adjustment titles, descriptions, and reasons
 * ensuring 100% Hindi/English parity regardless of when the adjustment was created.
 */
export function localizeAdjustment(
  adj: TaskAdjustment,
  language: 'en' | 'hi',
  baseDayTitle: string
): { title: string; desc: string; reason: string } {
  const isHi = language === 'hi';

  let title = isHi ? (adj.adjustedTitleHi || adj.adjustedTitle) : (adj.adjustedTitleEn || adj.adjustedTitle);
  let desc = isHi ? (adj.adjustedDescHi || adj.adjustedDesc) : (adj.adjustedDescEn || adj.adjustedDesc);
  let reason = isHi ? (adj.reasonHi || adj.reason) : (adj.reasonEn || adj.reason);

  if (isHi) {
    // Translate Title if stored in English
    if (!adj.adjustedTitleHi) {
      if (title?.toLowerCase().includes('neem') || title?.toLowerCase().includes('foliar')) {
        title = 'आपातकालीन जैविक नीम स्प्रे (5ml/L)';
      } else if (title?.toLowerCase().includes('sticky trap') || title?.toLowerCase().includes('larval')) {
        title = 'चिपचिपे ट्रैप्स व कीट प्रभाव निरीक्षण';
      } else if (title?.toLowerCase().includes('postponed')) {
        title = `स्थगित: ${baseDayTitle} (वर्षा)`;
      } else if (title?.toLowerCase().includes('rescheduled')) {
        title = `पुनर्निर्धारित: ${baseDayTitle}`;
      } else if (title?.toLowerCase().includes('drainage channel') || title?.toLowerCase().includes('runoff') || title?.toLowerCase().includes('drainage & soil')) {
        title = 'खेत जल निकासी व मेड़ निरीक्षण';
      } else if (title?.toLowerCase().includes('mulching')) {
        title = 'जड़ों के पास आंशिक जैविक मल्चिंग';
      } else if (title?.toLowerCase().includes('irrigation deferred')) {
        title = 'सिंचाई स्थगित (पर्याप्त वर्षा/नमी)';
      }
    }

    // Translate Desc if stored in English
    if (!adj.adjustedDescHi && desc) {
      if (desc.toLowerCase().includes('neem oil') || desc.toLowerCase().includes('foliar spray')) {
        desc = 'नीम तेल का छिड़काव सुबह 8 बजे से पहले करें।';
      } else if (desc.toLowerCase().includes('sticky trap') || desc.toLowerCase().includes('inspect canopy')) {
        desc = 'पीले चिपचिपे कार्ड लगाएं व पत्तियों का पुनरीक्षण करें।';
      } else if (desc.toLowerCase().includes('deferred by 2 days') || desc.toLowerCase().includes('heavy rain')) {
        desc = 'भारी वर्षा के कारण कार्य 2 दिन आगे बढ़ाया गया।';
      } else if (desc.toLowerCase().includes('runoff') || desc.toLowerCase().includes('water stagnation') || desc.toLowerCase().includes('waterlogging')) {
        desc = 'वर्षा के बाद जलभराव की स्थिति जांचें।';
      } else if (desc.toLowerCase().includes('tomorrow morning')) {
        desc = 'विलंबित कार्य को कल सुबह प्राथमिकता से पूर्ण करें।';
      } else if (desc.toLowerCase().includes('mulch')) {
        desc = 'सूखी घास या पत्तों की 2-3 सेमी परत बिछाएं।';
      } else if (desc.toLowerCase().includes('irrigation deferred') || desc.toLowerCase().includes('moisture sufficient')) {
        desc = 'पर्याप्त नमी व बारिश के कारण सिंचाई 2 दिन आगे बढ़ाई गई।';
      }
    }

    // Translate Reason if stored in English
    if (!adj.reasonHi && reason) {
      if (reason.toLowerCase().includes('leaf/pest') || reason.toLowerCase().includes('pest symptoms') || reason.toLowerCase().includes('leaf')) {
        reason = 'पत्तियों में कीट/रोग लक्षण दर्ज';
      } else if (reason.toLowerCase().includes('suppression') || reason.toLowerCase().includes('verify pest')) {
        reason = 'कीट निवारण प्रभाव की पुष्टि';
      } else if (reason.toLowerCase().includes('rainfall') || reason.toLowerCase().includes('waterlogging')) {
        reason = 'भारी वर्षा एवं जलभराव से सुरक्षा';
      } else if (reason.toLowerCase().includes('aeration') || reason.toLowerCase().includes('post-rain') || reason.toLowerCase().includes('soil')) {
        reason = 'वर्षा पश्चात मिट्टी स्वास्थ्य जांच';
      } else if (reason.toLowerCase().includes('delay reported')) {
        reason = 'किसान द्वारा कार्य विलंब दर्ज किया गया';
      } else if (reason.toLowerCase().includes('conserve') || reason.toLowerCase().includes('outage')) {
        reason = 'सिंचाई में रुकावट के कारण नमी संरक्षण';
      } else if (reason.toLowerCase().includes('rain expected') || reason.toLowerCase().includes('rain forecast')) {
        reason = 'वर्षा का पूर्वानुमान';
      }
    }
  } else {
    // Translate Title if stored in Hindi
    if (!adj.adjustedTitleEn) {
      if (title?.includes('नीम') || title?.includes('जैविक')) {
        title = 'Foliar Neem Protection (5ml/L)';
      } else if (title?.includes('चिपचिपे') || title?.includes('ट्रैप्स')) {
        title = 'Sticky Traps & Larval Inspection';
      } else if (title?.includes('स्थगित')) {
        title = `Postponed: ${baseDayTitle} (Rain)`;
      } else if (title?.includes('पुनर्निर्धारित')) {
        title = `Rescheduled: ${baseDayTitle}`;
      } else if (title?.includes('जल निकासी') || title?.includes('मेड़ निरीक्षण')) {
        title = 'Field Drainage Channel Inspection';
      } else if (title?.includes('मल्चिंग')) {
        title = 'Crop Root Organic Mulching';
      } else if (title?.includes('सिंचाई स्थगित')) {
        title = 'Irrigation Deferred (Moisture Optimal)';
      }
    }

    // Translate Desc if stored in Hindi
    if (!adj.adjustedDescEn && desc) {
      if (desc.includes('नीम तेल')) {
        desc = 'Apply 5ml/L neem oil foliar spray in early morning.';
      } else if (desc.includes('चिपचिपे कार्ड')) {
        desc = 'Install yellow sticky traps and inspect canopy.';
      } else if (desc.includes('भारी वर्षा')) {
        desc = 'Field activity deferred by 2 days due to heavy rain.';
      } else if (desc.includes('जलभराव')) {
        desc = 'Check field runoff channels after rain.';
      } else if (desc.includes('कल सुबह')) {
        desc = 'Complete deferred task tomorrow morning.';
      } else if (desc.includes('सूखी घास')) {
        desc = 'Lay 2-3cm layer of dry grass mulch to conserve moisture.';
      } else if (desc.includes('पर्याप्त नमी')) {
        desc = 'Soil moisture sufficient. Irrigation deferred by 2 days.';
      }
    }

    // Translate Reason if stored in Hindi
    if (!adj.reasonEn && reason) {
      if (reason.includes('कीट/रोग') || reason.includes('पत्तियों')) {
        reason = 'Farmer reported leaf/pest symptoms';
      } else if (reason.includes('कीट निवारण') || reason.includes('प्रभाव की पुष्टि')) {
        reason = 'Verify pest suppression effect';
      } else if (reason.includes('भारी वर्षा') || reason.includes('जलभराव')) {
        reason = 'Heavy rainfall & waterlogging mitigation';
      } else if (reason.includes('मिट्टी स्वास्थ्य') || reason.includes('वातन')) {
        reason = 'Post-rain soil aeration check';
      } else if (reason.includes('कार्य विलंब')) {
        reason = 'Task delay reported from field';
      } else if (reason.includes('नमी संरक्षण')) {
        reason = 'Conserve root moisture during irrigation outage';
      } else if (reason.includes('पूर्वानुमान')) {
        reason = 'Precipitation forecast';
      }
    }

  }

  return {
    title: title || baseDayTitle,
    desc: desc || '',
    reason: reason || (isHi ? 'खेत परिस्थिति अनुसार समायोजन' : 'Adjusted based on field conditions'),
  };
}

/**
 * Retrieves weekly action plan with dynamic AI adjustments overlaid on each day.
 */
export function getAdjustedWeekPlan(
  season: 'Kharif' | 'Rabi' | 'Zaid',
  weekNumber: number,
  language: 'en' | 'hi' = 'en',
  cropNames?: string[],
  adjustments?: Record<number, TaskAdjustment>
): WeekPlan & { days: (DailyAction & { isAdjusted?: boolean; adjustment?: TaskAdjustment })[] } {
  const basePlan = getWeeklyActionPlan(season, weekNumber, language, cropNames);
  if (!adjustments || Object.keys(adjustments).length === 0) {
    return basePlan;
  }

  const adjustedDays = basePlan.days.map((dayItem) => {
    const adj = adjustments[dayItem.dayOfSeason];
    if (adj) {
      const loc = localizeAdjustment(adj, language, dayItem.title);
      return {
        ...dayItem,
        title: loc.title,
        desc: loc.desc ? `${loc.desc} (${language === 'hi' ? 'कारण' : 'Reason'}: ${loc.reason})` : dayItem.desc,
        category: adj.category || dayItem.category,
        isAdjusted: true,
        adjustment: adj,
      };
    }
    return dayItem;
  });

  return {
    ...basePlan,
    days: adjustedDays,
  };
}


/**
 * Computes the dynamic calendar progress from the plan's start date with active AI adjustments.
 */
export function calculatePlanProgress(
  state: PlanExecutionState,
  season: 'Kharif' | 'Rabi' | 'Zaid',
  cropNames?: string[],
  language: 'en' | 'hi' = 'en'
): PlanProgressInfo {
  const totalWeeks = getSeasonWeeksCount(season);
  const totalDays = totalWeeks * 7;

  if (!state.isStarted || !state.startDate) {
    const week1Plan = getAdjustedWeekPlan(season, 1, language, cropNames, state.adjustments);
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

  // Retrieve today's scheduled task with adjustments overlaid
  const weekPlan = getAdjustedWeekPlan(season, currentWeek, language, cropNames, state.adjustments);
  const dayIndexInWeek = (currentDay - 1) % 7;
  const todayTask = weekPlan.days[dayIndexInWeek] || weekPlan.days[0] || null;

  // Derive human status labels
  let status: PlanStatus = state.currentStatus;
  const hasRecentAdjustments = Object.keys(state.adjustments || {}).length > 0;

  if (isCompleted) {
    status = 'COMPLETED';
  } else if (hasRecentAdjustments && status === 'ACTIVE') {
    status = 'PLAN_UPDATED';
  } else if (status === 'NOT_STARTED') {
    status = 'ACTIVE';
  }

  const statusMap: Record<PlanStatus, { en: string; hi: string }> = {
    NOT_STARTED: { en: 'Not Started', hi: 'शुरू नहीं हुई' },
    ACTIVE: { en: 'Active', hi: 'सक्रिय' },
    ON_TRACK: { en: 'On Track', hi: 'समय पर जारी' },
    NEEDS_ATTENTION: { en: 'Needs Attention', hi: 'ध्यान देने योग्य' },
    PLAN_UPDATED: { en: 'Plan Adjusted by AI', hi: 'योजना AI द्वारा समायोजित' },
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
 * Applies single or multi-day task adjustments to the plan execution state.
 */
export function applyPlanAdjustments(
  currentState: PlanExecutionState,
  adjustments: TaskAdjustment | TaskAdjustment[]
): PlanExecutionState {
  const adjList = Array.isArray(adjustments) ? adjustments : [adjustments];
  const newAdjustments = { ...currentState.adjustments };
  const newStatusMap = { ...currentState.taskStatusMap };

  for (const adj of adjList) {
    newAdjustments[adj.originalDay] = adj;
    if (adj.actionTaken === 'postponed') {
      newStatusMap[adj.originalDay] = 'delayed';
    }
  }

  const nextState: PlanExecutionState = {
    ...currentState,
    currentStatus: 'PLAN_UPDATED',
    adjustments: newAdjustments,
    taskStatusMap: newStatusMap,
    lastActiveDate: new Date().toISOString(),
  };

  savePlanExecutionState(nextState);
  return nextState;
}

/**
 * Clears adjustments for a specific day or all days.
 */
export function clearPlanAdjustments(
  currentState: PlanExecutionState,
  dayNumber?: number
): PlanExecutionState {
  const newAdjustments = { ...currentState.adjustments };
  if (dayNumber !== undefined) {
    delete newAdjustments[dayNumber];
  } else {
    for (const key of Object.keys(newAdjustments)) {
      delete newAdjustments[Number(key)];
    }
  }

  const nextState: PlanExecutionState = {
    ...currentState,
    adjustments: newAdjustments,
    currentStatus: Object.keys(newAdjustments).length > 0 ? 'PLAN_UPDATED' : 'ACTIVE',
    lastActiveDate: new Date().toISOString(),
  };

  savePlanExecutionState(nextState);
  return nextState;
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

  const nextState: PlanExecutionState = {
    ...currentState,
    completedDays: newCompleted,
    taskStatusMap: newStatusMap,
    lastActiveDate: new Date().toISOString(),
  };

  savePlanExecutionState(nextState);
  return nextState;
}

