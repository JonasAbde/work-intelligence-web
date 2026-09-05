import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRoutes,
  mapBackendWorkItem,
  mapBackendObservation,
  mapBackendMetrics,
  buildReviewPayload,
  buildObservationPayload,
  deriveReviewQueue,
  reviewUiStatus,
  shouldUseLocalPreviewMutations,
} from '../src/api/contracts.ts';

const routes = buildRoutes('/api', 'tenant-a');

test('routes match authoritative current Work Intelligence V2 API', () => {
  assert.equal(routes.health, '/api/healthz');
  assert.equal(routes.observations, '/api/v1/observations');
  assert.equal(routes.observationList(100), '/api/v1/observations?tenant_id=tenant-a&limit=100');
  assert.equal(routes.observationList(25, 'email'), '/api/v1/observations?tenant_id=tenant-a&limit=25&source=email');
  assert.equal(routes.workItems(100), '/api/v1/work-items?tenant_id=tenant-a&limit=100');
  assert.equal(routes.workItems(50, 'OPEN', 'high'), '/api/v1/work-items?tenant_id=tenant-a&limit=50&status=OPEN&priority=high');
  assert.equal(routes.workItem('wi_123'), '/api/v1/work-items/wi_123?tenant_id=tenant-a');
  assert.equal(routes.review('wi_123'), '/api/v1/work-items/wi_123/review?tenant_id=tenant-a');
  assert.equal(routes.transitions('wi_123'), '/api/v1/work-items/wi_123/transitions?tenant_id=tenant-a');
  assert.equal(routes.publications('wi_123'), '/api/v1/work-items/wi_123/publications?tenant_id=tenant-a');
  assert.equal(routes.actions('wi_123'), '/api/v1/work-items/wi_123/actions?tenant_id=tenant-a');
  assert.equal(routes.readiness, '/api/v1/readiness');
  assert.equal(routes.usage, '/api/v1/usage');
  assert.equal(routes.metrics, '/api/v1/metrics');
});

test('observation ingest payload binds frontend source data to configured tenant', () => {
  assert.deepEqual(buildObservationPayload('tenant-a', {
    source: 'email',
    text: 'Please send confirmation',
    external_id: 'gmail:msg-1',
    actor: 'customer@example.com',
    priority_hint: 'high',
    metadata: { provider: 'gmail' },
  }), {
    tenant_id: 'tenant-a',
    source: 'email',
    text: 'Please send confirmation',
    external_id: 'gmail:msg-1',
    actor: 'customer@example.com',
    priority_hint: 'high',
    metadata: { provider: 'gmail' },
  });
});

test('backend OPEN work item maps to reviewable UI item without invented execution state', () => {
  const item = mapBackendWorkItem({
    id: 'wi_123', tenant_id: 'tenant-a', title: 'Send confirmation', summary: 'Customer needs confirmation',
    status: 'OPEN', priority: 'high', next_action: 'Send email', confidence: 0.91,
    canonical_key: 'abc', canonical_tokens: ['send', 'confirmation'], observation_count: 1,
    created_at: '2026-09-05T10:00:00Z', updated_at: '2026-09-05T10:00:00Z', owner: 'ops@example.com', due_hint: 'before Monday'
  });
  assert.equal(item.status, 'needs_review');
  assert.equal(item.description, 'Customer needs confirmation');
  assert.equal(item.owner.email, 'ops@example.com');
  assert.equal(item.dueDate, 'before Monday');
  assert.equal(item.confidence, 0.91);
});

test('global backend observations map into source-neutral UI observations without invented work links', () => {
  const obs = mapBackendObservation({
    id: 'obs_1', tenant_id: 'tenant-a', source: 'email', text: 'Please send confirmation',
    external_id: 'msg-1', actor: 'customer@example.com', occurred_at: '2026-09-05T10:00:00Z', created_at: '2026-09-05T10:00:01Z'
  });
  assert.equal(obs.source, 'gmail');
  assert.equal(obs.linkedWorkItemId, undefined);
  assert.equal(obs.resolutionStatus, 'unprocessed');
  assert.equal(obs.rawText, 'Please send confirmation');
});

test('work-item detail observations may be mapped with an authoritative work link', () => {
  const obs = mapBackendObservation({
    id: 'obs_2', tenant_id: 'tenant-a', source: 'calendar', text: 'Follow up',
    external_id: 'event-1', actor: 'owner@example.com', occurred_at: null, created_at: '2026-09-05T11:00:00Z'
  }, 'wi_123');
  assert.equal(obs.source, 'calendar');
  assert.equal(obs.linkedWorkItemId, 'wi_123');
  assert.equal(obs.resolutionStatus, 'linked_to_workitem');
});

test('review payload uses backend review contract', () => {
  assert.deepEqual(buildReviewPayload('approve', 'owner@example.com', 'Reviewed'), {
    action: 'approve', actor: 'owner@example.com', reason: 'Reviewed', resume_at: null
  });
});

test('review queue is derived only from backend-open items', () => {
  const open = mapBackendWorkItem({
    id: 'wi_open', tenant_id: 'tenant-a', title: 'Open', summary: 'Open', status: 'OPEN', priority: 'medium',
    next_action: 'Review', confidence: 0.8, canonical_key: 'o', canonical_tokens: [], observation_count: 1,
    created_at: '2026-09-05T10:00:00Z', updated_at: '2026-09-05T10:00:00Z', owner: null, due_hint: null
  });
  const approved = { ...open, id: 'wi_approved', status: 'approved' };
  const queue = deriveReviewQueue([open, approved]);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].workItem.id, 'wi_open');
});

test('metrics mapping matches durable V2 recorder without inventing unsupported KPIs', () => {
  const result = mapBackendMetrics({
    count_by_action: { replayed: 1, created: 4, merged: 2, observed: 3 },
    count_by_source: { email: 5, conversation: 5 },
    count_by_tenant: { 'tenant-a': 10 },
    open_work_items: { 'tenant-a': 3 },
    total_observations: 10,
    total_work_items: 4,
  }, 3);
  assert.equal(result.activeObservationsToday, 10);
  assert.equal(result.workItemsDiscoveredToday, 4);
  assert.equal(result.pendingReviewCount, 3);
  assert.equal(result.autonomousResolutionRate, 0);
  assert.equal(result.humanInterventionRatio, 0);
  assert.equal(result.meanInferenceLatencyMs, 0);
  assert.equal(result.policyAlignmentScore, 0);
});

test('approval changes UI to approved, never published', () => {
  assert.equal(reviewUiStatus('approve'), 'approved');
  assert.equal(reviewUiStatus('reject'), 'rejected');
});

test('live mode never performs local-only canonical mutations', () => {
  assert.equal(shouldUseLocalPreviewMutations(false), false);
  assert.equal(shouldUseLocalPreviewMutations(true), true);
});
