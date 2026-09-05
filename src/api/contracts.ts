import type { Observation, Priority, ReviewQueueItem, SourceType, SystemMetrics, WorkItem, WorkItemStatus } from '../types/index.ts';

export interface BackendWorkItem {
  id: string;
  tenant_id: string;
  title: string;
  summary: string;
  status: string;
  priority: string;
  next_action: string;
  confidence: number;
  canonical_key: string;
  canonical_tokens: string[];
  observation_count: number;
  created_at: string;
  updated_at: string;
  owner: string | null;
  due_hint: string | null;
}

export interface BackendObservation {
  id: string;
  tenant_id: string;
  source: string;
  text: string;
  external_id: string | null;
  actor: string | null;
  occurred_at: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface BackendMetrics {
  total_ingested?: number;
  total_candidates?: number;
  total_approved?: number;
  total_published?: number;
  total_rejected?: number;
  total_cancelled?: number;
  total_snoozed?: number;
  total_promoted?: number;
  by_status?: Record<string, number>;
  by_source?: Record<string, number>;
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

export function buildRoutes(baseUrl: string, tenantId: string) {
  const tenant = encode(tenantId);
  return {
    health: `${baseUrl}/healthz`,
    workItems: (limit = 100) => `${baseUrl}/v1/work-items?tenant_id=${tenant}&limit=${limit}`,
    workItem: (id: string) => `${baseUrl}/v1/work-items/${encode(id)}?tenant_id=${tenant}`,
    review: (id: string) => `${baseUrl}/v1/work-items/${encode(id)}/review?tenant_id=${tenant}`,
    publish: (id: string) => `${baseUrl}/v1/work-items/${encode(id)}/publish?tenant_id=${tenant}`,
    promote: (id: string) => `${baseUrl}/v1/work-items/${encode(id)}/promote?tenant_id=${tenant}`,
    evidence: (id: string) => `${baseUrl}/v1/work-items/${encode(id)}/evidence?tenant_id=${tenant}`,
    metrics: `${baseUrl}/v1/metrics`,
    monitoring: `${baseUrl}/v1/monitoring`,
    version: `${baseUrl}/v1/version`,
  };
}

function mapStatus(status: string): WorkItemStatus {
  switch (status.toUpperCase()) {
    case 'OPEN': return 'needs_review';
    case 'APPROVED': return 'approved';
    case 'PUBLISHED': return 'published';
    case 'PROMOTED_TO_WORKS': return 'in_progress';
    case 'REJECTED': return 'rejected';
    case 'SNOOZED': return 'blocked';
    case 'CANCELLED': return 'completed';
    default: return 'inferred';
  }
}

function mapPriority(priority: string): Priority {
  switch (priority.toLowerCase()) {
    case 'critical': return 'urgent';
    case 'high': return 'high';
    case 'low': return 'low';
    default: return 'medium';
  }
}

function mapSource(source: string): SourceType {
  switch (source.toLowerCase()) {
    case 'email':
    case 'gmail': return 'gmail';
    case 'calendar':
    case 'google_calendar': return 'calendar';
    case 'conversation': return 'conversation';
    case 'renos': return 'renos';
    case 'code':
    case 'github':
    case 'codebase': return 'code';
    default: return 'system';
  }
}

function actorParts(actor: string | null): { name: string; email: string } {
  if (!actor) return { name: 'Unknown source', email: '' };
  if (actor.includes('@')) return { name: actor.split('@')[0], email: actor };
  return { name: actor, email: '' };
}

export function mapBackendWorkItem(item: BackendWorkItem): WorkItem {
  const status = mapStatus(item.status);
  const owner = item.owner ?? '';
  return {
    id: item.id,
    title: item.title,
    description: item.summary,
    status,
    priority: mapPriority(item.priority),
    owner: {
      name: owner || 'Unassigned',
      email: owner.includes('@') ? owner : '',
      isAutonomousAgent: false,
    },
    dueDate: item.due_hint ?? undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    confidence: item.confidence,
    whyExists: {
      inferenceSummary: item.next_action || item.summary,
      model: 'Aftergraph Work Intelligence V2',
      triggerObservationId: '',
      inferredIntent: item.next_action,
    },
    resolution: {
      decisionType: 'autonomous_created',
      details: `Canonical key ${item.canonical_key}; ${item.observation_count} supporting observation(s).`,
    },
    policies: [],
    evidence: [],
    publications: [],
    activity: [],
    sourceObservationIds: [],
    reviewCategory: status === 'needs_review' ? 'high_confidence' : undefined,
  };
}

export function mapBackendObservation(observation: BackendObservation, linkedWorkItemId?: string): Observation {
  const actor = actorParts(observation.actor);
  return {
    id: observation.id,
    source: mapSource(observation.source),
    actor,
    timestamp: observation.occurred_at || observation.created_at,
    rawText: observation.text,
    inferredAction: '',
    confidence: 0,
    resolutionStatus: linkedWorkItemId ? 'linked_to_workitem' : 'unprocessed',
    linkedWorkItemId,
    provenance: {
      originSystem: observation.source,
      externalId: observation.external_id ?? observation.id,
      checksum: '',
    },
  };
}

export function buildReviewPayload(action: 'approve' | 'reject' | 'snooze' | 'cancel', actor: string, reason = '', resumeAt: string | null = null) {
  return {
    action,
    actor,
    reason,
    resume_at: resumeAt,
  };
}

export function deriveReviewQueue(items: WorkItem[]): ReviewQueueItem[] {
  return items
    .filter(item => item.status === 'needs_review')
    .map(item => ({
      id: `review-${item.id}`,
      workItem: item,
      category: item.confidence >= 0.8 ? 'high_confidence' : 'ambiguous_merge',
      urgency: item.priority === 'urgent' ? 'critical' : item.priority === 'high' ? 'high' : 'normal',
      reasoning: 'Backend state OPEN requires explicit human review before consequential publication or WORKS promotion.',
    }));
}

export function mapBackendMetrics(metrics: BackendMetrics, pendingReviewCount: number): SystemMetrics {
  const candidates = metrics.total_candidates ?? 0;
  const automated = (metrics.total_published ?? 0) + (metrics.total_promoted ?? 0);
  const reviewed = (metrics.total_approved ?? 0) + (metrics.total_rejected ?? 0);
  const denominator = candidates || 1;
  return {
    autonomousResolutionRate: candidates ? (automated / denominator) * 100 : 0,
    humanInterventionRatio: candidates ? (reviewed / denominator) * 100 : 0,
    meanInferenceLatencyMs: 0,
    activeObservationsToday: metrics.total_ingested ?? 0,
    workItemsDiscoveredToday: candidates,
    pendingReviewCount,
    policyAlignmentScore: 0,
  };
}

export function reviewUiStatus(action: 'approve' | 'reject' | 'snooze' | 'cancel'): WorkItemStatus {
  switch (action) {
    case 'approve': return 'approved';
    case 'reject': return 'rejected';
    case 'snooze': return 'blocked';
    case 'cancel': return 'completed';
  }
}
