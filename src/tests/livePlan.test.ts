import { describe, it, expect } from 'bun:test';
import {
  calculatePlanProgress,
  startPlanExecution,
  toggleTaskCompletion,
  type PlanExecutionState,
} from '../lib/planProgress';
import {
  getContextualTaskChecklist,
  UNIVERSAL_OBSERVATIONS,
} from '../lib/contextualChecklists';
import { runAutonomousCycle } from '../services/autonomousSentinel';
import { askVoiceAgent } from '../services/voiceAgentService';
import type { FarmDecisionResponse } from '../types/farm';

describe('Live Progressive Plan & Sentinel Lifecycle', () => {
  it('correctly handles unstarted plan (preview state)', () => {
    const state: PlanExecutionState = {
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

    const progress = calculatePlanProgress(state, 'Kharif', ['Soybean', 'Cotton'], 'en');
    expect(progress.isStarted).toBe(false);
    expect(progress.currentDay).toBe(1);
    expect(progress.currentWeek).toBe(1);
    expect(progress.todayTask).toBeDefined();
    expect(progress.todayTask?.dayOfSeason).toBe(1);
  });

  it('starts plan and computes progressive active days', () => {
    let state: PlanExecutionState = {
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

    state = startPlanExecution(state);
    expect(state.isStarted).toBe(true);
    expect(state.startDate).toBeDefined();
    expect(state.currentStatus).toBe('ACTIVE');

    const progress = calculatePlanProgress(state, 'Kharif', ['Soybean'], 'en');
    expect(progress.isStarted).toBe(true);
    expect(progress.currentDay).toBe(1);
    expect(progress.currentWeek).toBe(1);
  });

  it('toggles task completion cleanly', () => {
    let state: PlanExecutionState = {
      isStarted: true,
      startDate: new Date().toISOString(),
      lastActiveDate: new Date().toISOString(),
      currentStatus: 'ACTIVE',
      completedDays: [],
      skippedDays: [],
      taskNotes: {},
      taskStatusMap: {},
      adjustments: {},
    };

    state = toggleTaskCompletion(state, 1);
    expect(state.completedDays).toContain(1);
    expect(state.taskStatusMap[1]).toBe('completed');

    state = toggleTaskCompletion(state, 1);
    expect(state.completedDays).not.toContain(1);
    expect(state.taskStatusMap[1]).toBe('pending');
  });

  it('generates dynamic contextual questions based on task category', () => {
    const sowingTask = {
      day: 2,
      dayOfSeason: 2,
      title: 'Sowing & Line Sowing',
      desc: 'Plant seeds at recommended spacing.',
      category: 'sowing' as const,
    };

    const checklist = getContextualTaskChecklist(2, 1, sowingTask, 'Soybean');
    expect(checklist.taskCategory).toBe('sowing');
    expect(checklist.questions.length).toBeGreaterThan(0);
    expect(checklist.questions.some((q) => q.id.includes('germination') || q.id.includes('sowing'))).toBe(true);
  });

  it('autonomous sentinel detects rain conflict with fertilizer task', () => {
    const mockDecision: FarmDecisionResponse = {
      allocated_crops: [
        {
          crop_name: 'Cotton',
          allocated_acres: 3,
          acre_share_pct: 60,
          expected_yield_quintal_per_acre: 10,
          expected_gross_revenue_inr: 200000,
          total_cost_inr: 80000,
          expected_net_profit_inr: 120000,
          roi_pct: 150,
          model_confidence_pct: 92,
          risk_level: 'LOW',
          sowing_window: 'June 15 - July 10',
          harvest_window: 'Oct 15 - Nov 30',
        },
      ],
      farm_totals: {
        total_allocated_acres: 3,
        fallow_acres: 0,
        total_investment_inr: 80000,
        total_expected_gross_revenue_inr: 200000,
        total_expected_net_profit_inr: 120000,
        expected_farm_roi_pct: 150,
        weighted_risk_label: 'LOW',
        portfolio_diversification_score: 85,
        budget_utilization_pct: 100,
      },
      weather: {
        forecast_rain_7d_total_mm: 55, // Heavy rain
        root_zone_soil_moisture_m3m3: 0.42,
        temp_max_c: 32,
        temp_min_c: 24,
      },
    };

    const planContext = {
      isStarted: true,
      currentDay: 21,
      currentWeek: 3,
      totalDays: 105,
      totalWeeks: 15,
      todayTask: {
        day: 21,
        dayOfSeason: 21,
        title: 'Urea Top Dressing & Micronutrient Spray',
        desc: 'Apply 25 kg/acre Urea before flowering.',
        category: 'nutrient' as const,
      },
      primaryCrop: 'Cotton',
      allocatedCrops: ['Cotton'],
      farmerObservations: ['rain_heavy'],
    };

    const { advisory, log } = runAutonomousCycle(mockDecision, 'en', null, planContext);
    expect(advisory).toBeDefined();
    expect(advisory?.headline.toLowerCase()).toContain('postpone');
    expect(log.action_type).toBe('APPLY_PROACTIVE_ADVISORY');
  });

  it('voice assistant responds with today task info when queried', async () => {
    const mockDecision: FarmDecisionResponse = {
      allocated_crops: [
        {
          crop_name: 'Soybean',
          allocated_acres: 2,
          acre_share_pct: 100,
          expected_yield_quintal_per_acre: 12,
          expected_gross_revenue_inr: 100000,
          total_cost_inr: 40000,
          expected_net_profit_inr: 60000,
          roi_pct: 150,
          model_confidence_pct: 90,
          risk_level: 'LOW',
          sowing_window: 'June 20 - July 5',
          harvest_window: 'Oct 1 - Oct 20',
        },
      ],
      farm_totals: {
        total_allocated_acres: 2,
        fallow_acres: 0,
        total_investment_inr: 40000,
        total_expected_gross_revenue_inr: 100000,
        total_expected_net_profit_inr: 60000,
        expected_farm_roi_pct: 150,
        weighted_risk_label: 'LOW',
        portfolio_diversification_score: 80,
        budget_utilization_pct: 100,
      },
    };

    const planContext = {
      isStarted: true,
      currentDay: 5,
      currentWeek: 1,
      totalDays: 105,
      totalWeeks: 15,
      todayTask: {
        day: 5,
        dayOfSeason: 5,
        title: 'Initial Emergence Check & Irrigation Review',
        desc: 'Inspect seedling germination count across all plots.',
        category: 'monitoring' as const,
      },
      primaryCrop: 'Soybean',
      allocatedCrops: ['Soybean'],
    };

    const response = await askVoiceAgent(
      'what is my task today?',
      mockDecision,
      'en',
      planContext
    );

    expect(response.intent).toBe('TODAY_TASK');
    expect(response.spoken_text).toContain('Day 5');
    expect(response.spoken_text).toContain('Initial Emergence Check');
  });
});
