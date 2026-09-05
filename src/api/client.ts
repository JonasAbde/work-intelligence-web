import { 
  WorkItem, 
  Observation, 
  ConnectionState, 
  ReviewQueueItem, 
  IntegrationStatus, 
  SystemMetrics 
} from '../types';
import { 
  mockWorkItems, 
  mockObservations, 
  mockReviewQueue, 
  mockIntegrations, 
  mockMetrics 
} from '../mock/fixtures';

const BASE_URL = '/api';

export interface HealthCheckResult {
  state: ConnectionState;
  statusCode?: number;
  latencyMs?: number;
  apiUrl: string;
  errorMessage?: string;
  timestamp: string;
}

export const apiClient = {
  async checkHealth(): Promise<HealthCheckResult> {
    const start = performance.now();
    const timestamp = new Date().toISOString();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      
      const res = await fetch(`${BASE_URL}/health`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      
      const latencyMs = Math.round(performance.now() - start);

      if (res.status === 401 || res.status === 403) {
        return {
          state: 'unauthorized',
          statusCode: res.status,
          latencyMs,
          apiUrl: BASE_URL,
          errorMessage: 'Authentication token missing or rejected by Aftergraph backend',
          timestamp
        };
      }

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || contentType.includes('text/html')) {
        return {
          state: 'unavailable',
          statusCode: res.status,
          latencyMs,
          apiUrl: BASE_URL,
          errorMessage: 'Authoritative backend service unreachable at configured endpoint',
          timestamp
        };
      }

      // Valid response from real backend
      return {
        state: 'connected',
        statusCode: res.status,
        latencyMs,
        apiUrl: BASE_URL,
        timestamp
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      return {
        state: 'unavailable',
        latencyMs: Math.round(performance.now() - start),
        apiUrl: BASE_URL,
        errorMessage: errorMsg,
        timestamp
      };
    }
  },

  async getWorkItems(isMockMode: boolean): Promise<WorkItem[]> {
    if (isMockMode) {
      return [...mockWorkItems];
    }
    const res = await fetch(`${BASE_URL}/work-items`);
    if (!res.ok) throw new Error(`Failed to fetch work items (${res.status})`);
    return res.json();
  },

  async getObservations(isMockMode: boolean): Promise<Observation[]> {
    if (isMockMode) {
      return [...mockObservations];
    }
    const res = await fetch(`${BASE_URL}/observations`);
    if (!res.ok) throw new Error(`Failed to fetch observations (${res.status})`);
    return res.json();
  },

  async getReviewQueue(isMockMode: boolean): Promise<ReviewQueueItem[]> {
    if (isMockMode) {
      return [...mockReviewQueue];
    }
    const res = await fetch(`${BASE_URL}/review-queue`);
    if (!res.ok) throw new Error(`Failed to fetch review queue (${res.status})`);
    return res.json();
  },

  async getIntegrations(isMockMode: boolean): Promise<IntegrationStatus[]> {
    if (isMockMode) {
      return [...mockIntegrations];
    }
    const res = await fetch(`${BASE_URL}/integrations`);
    if (!res.ok) throw new Error(`Failed to fetch integrations (${res.status})`);
    return res.json();
  },

  async getMetrics(isMockMode: boolean): Promise<SystemMetrics> {
    if (isMockMode) {
      return { ...mockMetrics };
    }
    const res = await fetch(`${BASE_URL}/metrics`);
    if (!res.ok) throw new Error(`Failed to fetch system metrics (${res.status})`);
    return res.json();
  },

  async approveWorkItem(id: string, isMockMode: boolean): Promise<boolean> {
    if (isMockMode) {
      return true;
    }
    const res = await fetch(`${BASE_URL}/work-items/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.ok;
  },

  async rejectWorkItem(id: string, reason: string, isMockMode: boolean): Promise<boolean> {
    if (isMockMode) {
      return true;
    }
    const res = await fetch(`${BASE_URL}/work-items/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    return res.ok;
  },

  async mergeCandidate(candidateId: string, targetWorkItemId: string, isMockMode: boolean): Promise<boolean> {
    if (isMockMode) {
      return true;
    }
    const res = await fetch(`${BASE_URL}/candidates/${candidateId}/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetWorkItemId })
    });
    return res.ok;
  }
};
