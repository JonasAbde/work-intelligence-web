import { WorkItem, Observation, ConnectionState, ReviewQueueItem, IntegrationStatus, SystemMetrics } from '../types';
import { mockWorkItems, mockObservations, mockReviewQueue, mockIntegrations, mockMetrics } from '../mock/fixtures';
import {
  BackendMetrics,
  BackendObservation,
  BackendWorkItem,
  buildReviewPayload,
  buildRoutes,
  deriveReviewQueue,
  mapBackendMetrics,
  mapBackendObservation,
  mapBackendWorkItem,
} from './contracts';

const BASE_URL = '/api';
const TENANT_ID = import.meta.env.VITE_WORK_INTELLIGENCE_TENANT_ID || 'default';
const REVIEW_ACTOR = import.meta.env.VITE_WORK_INTELLIGENCE_REVIEW_ACTOR || 'work-intelligence-web';
const routes = buildRoutes(BASE_URL, TENANT_ID);

interface BackendWorkItemListResponse {
  count: number;
  work_items: BackendWorkItem[];
}

interface BackendWorkItemDetailResponse {
  work_item: BackendWorkItem;
  observations: BackendObservation[];
  publications: Array<Record<string, unknown>>;
}

let inFlightWorkItems: Promise<BackendWorkItem[]> | null = null;

async function readJson<T>(res: Response, context: string): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${context} (${res.status})${detail ? `: ${detail}` : ''}`);
  }
  return res.json() as Promise<T>;
}

async function fetchBackendWorkItems(): Promise<BackendWorkItem[]> {
  if (!inFlightWorkItems) {
    inFlightWorkItems = fetch(routes.workItems(100))
      .then(res => readJson<BackendWorkItemListResponse>(res, 'Failed to fetch work items'))
      .then(data => data.work_items)
      .finally(() => {
        inFlightWorkItems = null;
      });
  }
  return inFlightWorkItems;
}

async function fetchBackendDetails(items: BackendWorkItem[]): Promise<BackendWorkItemDetailResponse[]> {
  return Promise.all(
    items.map(item =>
      fetch(routes.workItem(item.id)).then(res =>
        readJson<BackendWorkItemDetailResponse>(res, `Failed to fetch work item ${item.id}`)
      )
    )
  );
}

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
      const res = await fetch(routes.health, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
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
          timestamp,
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
          timestamp,
        };
      }

      const health = await res.json().catch(() => null) as { status?: string; service?: string } | null;
      if (!health || health.status !== 'ok' || health.service !== 'aftergraph-work-intelligence') {
        return {
          state: 'degraded',
          statusCode: res.status,
          latencyMs,
          apiUrl: BASE_URL,
          errorMessage: 'Unexpected health response from configured backend',
          timestamp,
        };
      }

      return { state: 'connected', statusCode: res.status, latencyMs, apiUrl: BASE_URL, timestamp };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      return {
        state: 'unavailable',
        latencyMs: Math.round(performance.now() - start),
        apiUrl: BASE_URL,
        errorMessage: errorMsg,
        timestamp,
      };
    }
  },

  async getWorkItems(isMockMode: boolean): Promise<WorkItem[]> {
    if (isMockMode) return [...mockWorkItems];
    const items = await fetchBackendWorkItems();
    return items.map(mapBackendWorkItem);
  },

  async getObservations(isMockMode: boolean): Promise<Observation[]> {
    if (isMockMode) return [...mockObservations];
    const items = await fetchBackendWorkItems();
    const details = await fetchBackendDetails(items);
    return details.flatMap(detail =>
      detail.observations.map(observation => mapBackendObservation(observation, detail.work_item.id))
    );
  },

  async getReviewQueue(isMockMode: boolean): Promise<ReviewQueueItem[]> {
    if (isMockMode) return [...mockReviewQueue];
    const items = (await fetchBackendWorkItems()).map(mapBackendWorkItem);
    return deriveReviewQueue(items);
  },

  async getIntegrations(isMockMode: boolean): Promise<IntegrationStatus[]> {
    if (isMockMode) return [...mockIntegrations];
    // V2 has no integration-health endpoint yet. Fail closed by showing no fabricated integrations.
    return [];
  },

  async getMetrics(isMockMode: boolean): Promise<SystemMetrics> {
    if (isMockMode) return { ...mockMetrics };
    const [metricsResponse, backendItems] = await Promise.all([
      fetch(routes.metrics).then(res => readJson<BackendMetrics>(res, 'Failed to fetch system metrics')),
      fetchBackendWorkItems(),
    ]);
    const pendingReviewCount = backendItems.filter(item => item.status.toUpperCase() === 'OPEN').length;
    return mapBackendMetrics(metricsResponse, pendingReviewCount);
  },

  async approveWorkItem(id: string, isMockMode: boolean): Promise<boolean> {
    if (isMockMode) return true;
    const res = await fetch(routes.review(id), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildReviewPayload('approve', REVIEW_ACTOR, 'Approved in Work Intelligence Web')),
    });
    if (!res.ok) throw new Error(`Failed to approve work item (${res.status})`);
    return true;
  },

  async rejectWorkItem(id: string, reason: string, isMockMode: boolean): Promise<boolean> {
    if (isMockMode) return true;
    const res = await fetch(routes.review(id), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildReviewPayload('reject', REVIEW_ACTOR, reason)),
    });
    if (!res.ok) throw new Error(`Failed to reject work item (${res.status})`);
    return true;
  },

  async mergeCandidate(_candidateId: string, _targetWorkItemId: string, isMockMode: boolean): Promise<boolean> {
    if (isMockMode) return true;
    throw new Error('Candidate merge is not exposed by the authoritative Work Intelligence V2 API yet.');
  },
};
