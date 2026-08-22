/**
 * src/services/api.ts
 * Centralized API client for AgriOptima AI (USICT038)
 * Connects frontend directly to backend REST API with seamless standalone client fallback.
 */

import type {
  FarmDecisionRequest,
  FarmDecisionResponse,
  DistrictLocationItem,
} from '@/types/farm';
import { ALL_INDIAN_DISTRICTS } from '@/lib/districtsCatalog';
import { calculateClientFarmDecision } from './clientDecisionEngine';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export class ApiServiceError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiServiceError';
    this.status = status;
  }
}

/**
 * Helper to fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 2500): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Checks connectivity and system status of the Python backend service.
 */
export async function checkHealth(): Promise<{ status: string; service: string; version: string }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    }, 2000);
    if (!res.ok) {
      return { status: 'client_mode', service: 'AgriOptima Client AI Engine', version: '2.0.0' };
    }
    return await res.json();
  } catch {
    return { status: 'client_mode', service: 'AgriOptima Client AI Engine', version: '2.0.0' };
  }
}

/**
 * Retrieves the complete catalog of Indian districts and baseline agro-climatic profiles.
 */
export async function getAvailableLocations(): Promise<DistrictLocationItem[]> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/locations`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    }, 2000);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Fall back to built-in 786-district catalog
  }
  return ALL_INDIAN_DISTRICTS;
}

/**
 * Executes the complete autonomous agro-economic decision pipeline.
 * Tries backend API first; falls back seamlessly to client-side decision engine if server is unreachable.
 */
export async function getFarmDecision(request: FarmDecisionRequest): Promise<FarmDecisionResponse> {
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/farm/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(request),
    }, 3000);

    if (res.ok) {
      const data: FarmDecisionResponse = await res.json();
      return data;
    }
  } catch {
    console.info('Backend unavailable or blocked; executing autonomous client-side agro-economic decision solver.');
  }

  // Seamless client decision engine fallback
  return calculateClientFarmDecision(request);
}
