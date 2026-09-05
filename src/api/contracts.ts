import type {
  EvidenceItem,
  Observation,
  Priority,
  PublicationTarget,
  ReviewQueueItem,
  SourceType,
  SystemMetrics,
  WorkItem,
  WorkItemStatus,
} from '../types/index.ts';

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
  occurred_at: string | null;
  created_at: string | null;
  metadata?: Record<string, unknown>;
}

export interface BackendPublication {
  id: string;
  work_item_id: string;
  destination: string;
  external_id: string | null;
  response: Record<string, unknown>;
  published_at: string;
}

export interface BackendEvidenceRecord {
  kind: string;
  observation_id: string;
  source: string;
  external_id: string | null;
  actor: string | null;
  occurred_at: string | null;
  text_sha256: string;
}

export interface BackendEvidenceEnvelope {
  schema: string;
  bundle_id: string;
  provider_id: string;
  created_at: string;
  identity_chain: {
    tenant_id: string;
    work_item_id: string;
    canonical_key: string;
    title: string;
  };
  records: BackendEvidenceRecord[];
  observations_count: number;
  algorithm: string;
  digest: string;
}

export interface BackendMetrics {
  count_by_action?: Record<string, number>;
  count_by_source?: Record<string, number>;
  count_by_tenant?: Record<string, number>;
  open_work_items?: Record<string, number>;
  total_observations?: number;
  total_work_items?: number;
}

export interface BackendReadiness {
  status: 'pass' | 'fail' | string;
  checks: Record<string, boolean | undefined>;
  timestamp: string;
}

export interface BackendUsage {
  total_requests: number;
  total_errors: number;
  by_path: Record<string, number>;
  by_status: Record<string, number>;
}

export interface BackendTransition {
  id: string;
  from_status: string;
  to_status: string;
  action: string;
  actor: string;
  reason: string;
  created_at: string | null;
}

export interface BackendAllowedActions {
  work_item_id: string;
  status: string;
  actions: string[];
}

export interface ObservationIngestInput {
  source: string;
  text: string;
  external_id?: string;
  actor?: string;
  occurred_at?: string;
  metadata?: Record<string, unknown>;
  title_hint?: string;
  owner_hint?: string;
  due_hint?: string;
  priority_hint?: 'low' | 'medium' | 'high' | 'critical';
}

export interface BackendDetailProjection {
  observations: BackendObservation[];
  evidence: BackendEvidenceEnvelope | null;
  publications: BackendPublication[];
  transitions: BackendTransition[];
  allowedActions: string[];
}

function encode(value: string): string {
  return encodeURIComponent(value);
}

export function buildRoutes(baseUrl: string, tenantId: string) {
  const tenant = encode(tenantId);
  return {
    health: `${baseUrl}/healthz`,
    detailedHealth: `${baseUrl}/healthz/detailed`,
    observations: `${baseUrl}/v1/observations`,
    observationList: (limit = 100, source?: string) => `${baseUrl}/v1/observations?tenant_id=${tenant}&limit=${limit}${source ? `&source=${encode(source)}` : ''}`,
    workItems: (limit = 100, status?: string, priority?: string) => `${baseUrl}/v1/work-items?tenant_id=${tenant}&limit=${limit}${status ? `&status=${encode(status)}` : ''}${priority ? `&priority=${encode(priority)}` : ''}`,
    workItem: (id: string) => `${baseUrl}/v1/work-items/${encode(id)}?tenant_id=${tenant}`,
    review: (id: string) => `${baseUrl}/v1/work-items/${encode(id)}/review?tenant_id=${tenant}`,
    publish: (id: string) => `${baseUrl}/v1/work-items/${encode(id)}/publish?tenant_id=${tenant}`,
    promote: (id: string) => `${baseUrl}/v1/work-items/${encode(id)}/promote?tenant_id=${tenant}`,
    evidence: (id: string) => `${baseUrl}/v1/work-items/${encode(id)}/evidence?tenant_id=${tenant}`,
    transitions: (id: string) => `${baseUrl}/v1/work-items/${encode(id)}/transitions?tenant_id=${tenant}`,
    publications: (id: string) => `${baseUrl}/v1/work-items/${encode(id)}/publications?tenant_id=${tenant}`,
    actions: (id: string) => `${baseUrl}/v1/work-items/${encode(id)}/actions?tenant_id=${tenant}`,
    readiness: `${baseUrl}/v1/readiness`,
    usage: `${baseUrl}/v1/usage`,
    metrics: `${baseUrl}/v1/metrics`,
    monitoring: `${baseUrl}/v1/monitoring`,
    version: `${baseUrl}/v1/version`,
  };
}

export function buildObservationPayload(tenantId: string, input: ObservationIngestInput) {
  return { tenant_id: tenantId, ...input };
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

function evidenceType(source: string): EvidenceItem['type'] {
  switch (mapSource(source)) {
    case 'gmail': return 'email_thread';
    case 'calendar': return 'calendar_event';
    case 'code': return 'git_commit';
    case 'renos': return 'system_alert';
    default: return 'document';
  }
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
    owner: { name: owner || 'Unassigned', email: owner.includes('@') ? owner : '', isAutonomousAgent: false },
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
      decisionType: 'backend_resolved',
      details: `Canonical key ${item.canonical_key}; ${item.observation_count} supporting observation(s).`,
    },
    policies: [],
    evidence: [],
    publications: [],
    activity: [],
    sourceObservationIds: [],
    allowedActions: undefined,
    reviewCategory: status === 'needs_review' ? 'high_confidence' : undefined,
  };
}

export function mapBackendObservation(observation: BackendObservation, linkedWorkItemId?: string): Observation {
  const actor = actorParts(observation.actor);
  return {
    id: observation.id,
    source: mapSource(observation.source),
    actor,
    timestamp: observation.occurred_at || observation.created_at || new Date(0).toISOString(),
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

export function applyBackendDetail(workItem: WorkItem, detail: BackendDetailProjection): WorkItem {
  const evidence: EvidenceItem[] = detail.evidence?.records.map(record => ({
    id: `${detail.evidence?.bundle_id}:${record.observation_id}`,
    type: evidenceType(record.source),
    title: `${record.source} observation ${record.observation_id}`,
    snippet: record.external_id ? `External source id: ${record.external_id}` : 'Backend evidence record',
    timestamp: record.occurred_at || detail.evidence?.created_at || workItem.updatedAt,
    author: record.actor || 'Unknown source',
    hash: `sha256:${record.text_sha256}`,
    confidenceContribution: 0,
  })) ?? [];

  const publications: PublicationTarget[] = detail.publications.map(publication => ({
    id: publication.id,
    target: publication.destination,
    status: 'published',
    externalReference: publication.external_id ?? undefined,
    syncedAt: publication.published_at,
  }));

  const sourceObservationIds = detail.observations.map(observation => observation.id);
  const triggerObservationId = sourceObservationIds[0] ?? workItem.whyExists.triggerObservationId;

  return {
    ...workItem,
    whyExists: { ...workItem.whyExists, triggerObservationId },
    sourceObservationIds,
    evidence,
    publications,
    activity: detail.transitions.map(transition => ({
      id: transition.id,
      timestamp: transition.created_at || workItem.updatedAt,
      actor: transition.actor,
      isSystem: false,
      action: transition.action,
      detail: transition.reason || `${transition.from_status} → ${transition.to_status}`,
    })),
    allowedActions: [...detail.allowedActions],
  };
}

export function buildReviewPayload(action: 'approve' | 'reject' | 'snooze' | 'cancel', actor: string, reason = '', resumeAt: string | null = null) {
  return { action, actor, reason, resume_at: resumeAt };
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
  return {
    autonomousResolutionRate: 0,
    humanInterventionRatio: 0,
    meanInferenceLatencyMs: 0,
    activeObservationsToday: metrics.total_observations ?? 0,
    workItemsDiscoveredToday: metrics.total_work_items ?? 0,
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

export function shouldUseLocalPreviewMutations(isMockMode: boolean, search?: string): boolean {
  const query = search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const previewEnabled = new URLSearchParams(query).get('preview') === '1';
  return isMockMode && previewEnabled;
}
