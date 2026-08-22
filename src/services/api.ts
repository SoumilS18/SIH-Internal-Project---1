/**
 * src/services/api.ts
 * Centralized API client for AgriOptima AI (USICT038)
 * Connects frontend directly to backend REST API adapter.
 */

import type {
  FarmDecisionRequest,
  FarmDecisionResponse,
  DistrictLocationItem,
} from '@/types/farm';

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
 * Checks connectivity and system status of the Python backend service.
 */
export async function checkHealth(): Promise<{ status: string; service: string; version: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      throw new ApiServiceError(`Health check failed with status ${res.status}`, res.status);
    }
    return await res.json();
  } catch (err: any) {
    throw new ApiServiceError(err.message || 'Unable to connect to farm intelligence service.');
  }
}

/**
 * Retrieves the complete catalog of Indian districts and baseline agro-climatic profiles.
 */
export async function getAvailableLocations(): Promise<DistrictLocationItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/locations`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      throw new ApiServiceError(`Locations fetch failed with status ${res.status}`, res.status);
    }
    return await res.json();
  } catch (err: any) {
    throw new ApiServiceError(err.message || 'Failed to load locations catalog.');
  }
}

/**
 * Executes the complete autonomous agro-economic decision pipeline via backend API.
 */
export async function getFarmDecision(request: FarmDecisionRequest): Promise<FarmDecisionResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/farm/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const message = errBody.message || `API error with status ${res.status}`;
      throw new ApiServiceError(message, res.status);
    }

    const data: FarmDecisionResponse = await res.json();
    return data;
  } catch (err: any) {
    if (err instanceof ApiServiceError) {
      throw err;
    }
    throw new ApiServiceError(err.message || 'Unable to connect to farm intelligence service.');
  }
}
