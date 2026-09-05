import { WorkItem, Observation, ConnectionState, ReviewQueueItem, IntegrationStatus, SystemMetrics } from '../types';
import { mockWorkItems, mockObservations, mockReviewQueue, mockIntegrations, mockMetrics } from '../mock/fixtures';
import {
  BackendAllowedActions,
  BackendMetrics,
  BackendObservation,
  BackendReadiness,
  BackendTransition,
  BackendUsage,
  BackendWorkItem,
  ObservationIngestInput,
  buildObservationPayload,
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

interface BackendObservationListResponse {
  count: number;
  observations: BackendObservation[];
}

interface BackendTransitionListResponse {
  work_item_id: string;
  count: number;
  transitions: BackendTransition[];
}

interface BackendPublicationListResponse {
  work_item_id: string;
  count: number;
  publications: Array<Record<string, unknown>>;
}

export interface BackendIngestResult {
  action: string;
  observation: BackendObservation;
  work_item: BackendWorkItem | null;
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

      const health = await res.json().catch(() => null) as {
        status?: string;
        service?: string;
      } | null;

      if (!health || health.service !== 'aftergraph-work-intelligence') {
        return {
          state: 'degraded',
          statusCode: res.status,
          latencyMs,
          apiUrl: BASE_URL,
          errorMessage: 'Unexpected health response from configured backend',
          timestamp,
        };
      }

      if (health.status === 'degraded') {
        return {
          state: 'degraded',
          statusCode: res.status,
          latencyMs,
          apiUrl: BASE_URL,
          errorMessage: 'Backend is reachable but one or more dependencies are degraded',
          timestamp,
        };
      }

      if (health.status !== 'ok') {
        return {
          state: 'degraded',
          statusCode: res.status,
          latencyMs,
          apiUrl: BASE_URL,
          errorMessage: `Backend returned health state ${health.status || 'unknown'}`,
          timestamp,
        };
      }

      return { state: 'connected', statusCode: res.status, latencyMs, apiUrl: BASE_URL, timestamp };
    } catch (err: unknown) {
      return {
        state: 'unavailable',
        latencyMs: Math.round(performance.now() - start),
        apiUrl: BASE_URL,
        errorMessage: err instanceof Error ? err.message : 'Connection failed',
        timestamp,
      };
    }
  },

  async getWorkItems(isMockMode: boolean): Promise<WorkItem[]> {
    if (isMockMode) return [...mockWorkItems];
    return (await fetchBackendWorkItems()).map(mapBackendWorkItem);
  },

  async getObservations(isMockMode: boolean): Promise<Observation[]> {
    if (isMockMode) return [...mockObservations];
    const data = await fetch(routes.observationList(100))
      .then(res => readJson<BackendObservationListResponse>(res, 'Failed to fetch observations'));
    return data.observations.map(observation => mapBackendObservation(observation));
  },

  async getReviewQueue(isMockMode: boolean): Promise<ReviewQueueItem[]> {
    if (isMockMode) return [...mockReviewQueue];
    const res = await fetch(routes.workItems(100, 'OPEN'));
    const data = await readJson<BackendWorkItemListResponse>(res, 'Failed to fetch review queue');
    return deriveReviewQueue(data.work_items.map(mapBackendWorkItem));
  },

  async getIntegrations(isMockMode: boolean): Promise<IntegrationStatus[]> {
    if (isMockMode) return [...mockIntegrations];
    return [];
  },

  async getReadiness(isMockMode: boolean): Promise<BackendReadiness | null> {
    if (isMockMode) return null;
    return readJson<BackendReadiness>(await fetch(routes.readiness), 'Failed to fetch backend readiness');
  },

  async getUsage(isMockMode: boolean): Promise<BackendUsage | null> {
    if (isMockMode) return null;
    return readJson<BackendUsage>(await fetch(routes.usage), 'Failed to fetch backend usage');
  },

  async getAllowedActions(id: string, isMockMode: boolean): Promise<BackendAllowedActions | null> {
    if (isMockMode) return null;
    return readJson<BackendAllowedActions>(await fetch(routes.actions(id)), `Failed to fetch allowed actions for ${id}`);
  },

  async getTransitions(id: string, isMockMode: boolean): Promise<BackendTransition[]> {
    if (isMockMode) return [];
    const data = await readJson<BackendTransitionListResponse>(await fetch(routes.transitions(id)), `Failed to fetch transitions for ${id}`);
    return data.transitions;
  },

  async getPublications(id: string, isMockMode: boolean): Promise<Array<Record<string, unknown>>> {
    if (isMockMode) return [];
    const data = await readJson<BackendPublicationListResponse>(await fetch(routes.publications(id)), `Failed to fetch publications for ${id}`);
    return data.publications;
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

  async ingestObservation(input: ObservationIngestInput, isMockMode: boolean): Promise<BackendIngestResult | null> {
    if (isMockMode) return null;
    const res = await fetch(routes.observations, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildObservationPayload(TENANT_ID, input)),
    });
    return readJson<BackendIngestResult>(res, 'Failed to ingest observation');
  },

  async approveWorkItem(id: string, isMockMode: boolean): Promise<boolean> {
    if (isMockMode) return true;
    const res = await fetch(routes.review(id), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildReviewPayload('approve', REVIEW_ACTOR, 'Approved in Work Intelligence Web')),
    });
    await readJson<Record<string, unknown>>(res, 'Failed to approve work item');
    return true;
  },

  async rejectWorkItem(id: string, reason: string, isMockMode: boolean): Promise<boolean> {
    if (isMockMode) return true;
    const res = await fetch(routes.review(id), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildReviewPayload('reject', REVIEW_ACTOR, reason)),
    });
    await readJson<Record<string, unknown>>(res, 'Failed to reject work item');
    return true;
  },

  async mergeCandidate(_candidateId: string, _targetWorkItemId: string, isMockMode: boolean): Promise<boolean> {
    if (isMockMode) return true;
    throw new Error('Candidate merge is not exposed by the authoritative Work Intelligence V2 API yet.');
  },
};
