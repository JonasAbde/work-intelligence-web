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
  assert.equal(routes.workItems(50, 'OPEN', 'high'), '/api/v1/work-items?tenant_id=tenant-a&limit=50&status=OPEN&priority=high');
  assert.equal(routes.review('wi_123'), '/api/v1/work-items/wi_123/review?tenant_id=tenant-a');
  assert.equal(routes.transitions('wi_123'), '/api/v1/work-items/wi_123/transitions?tenant_id=tenant-a');
  assert.equal(routes.publications('wi_123'), '/api/v1/work-items/wi_123/publications?tenant_id=tenant-a');
  assert.equal(routes.actions('wi_123'), '/api/v1/work-items/wi_123/actions?tenant_id=tenant-a');
  assert.equal(routes.readiness, '/api/v1/readiness');
  assert.equal(routes.usage, '/api/v1/usage');
});

test('observation ingest payload binds source data to configured tenant', () => {
  assert.deepEqual(buildObservationPayload('tenant-a', {
    source: 'email',
    text: 'Please send confirmation',
    external_id: 'gmail:msg-1',
    actor: 'customer@example.com',
    priority_hint: 'high',
  }), {
    tenant_id: 'tenant-a',
    source: 'email',
    text: 'Please send confirmation',
    external_id: 'gmail:msg-1',
    actor: 'customer@example.com',
    priority_hint: 'high',
  });
});

test('OPEN maps to needs_review and never invents execution state', () => {
  const item = mapBackendWorkItem({
    id: 'wi_123', tenant_id: 'tenant-a', title: 'Send confirmation', summary: 'Customer needs confirmation',
    status: 'OPEN', priority: 'high', next_action: 'Send email', confidence: 0.91,
    canonical_key: 'abc', canonical_tokens: ['send', 'confirmation'], observation_count: 1,
    created_at: '2026-09-05T10:00:00Z', updated_at: '2026-09-05T10:00:00Z', owner: 'ops@example.com', due_hint: 'before Monday'
  });
  assert.equal(item.status, 'needs_review');
  assert.equal(item.owner.email, 'ops@example.com');
  assert.equal(item.confidence, 0.91);
});

test('global observations stay unlinked unless backend detail provides a work link', () => {
  const obs = mapBackendObservation({
    id: 'obs_1', tenant_id: 'tenant-a', source: 'email', text: 'Please send confirmation',
    external_id: 'msg-1', actor: 'customer@example.com', occurred_at: '2026-09-05T10:00:00Z', created_at: '2026-09-05T10:00:01Z'
  });
  assert.equal(obs.source, 'gmail');
  assert.equal(obs.linkedWorkItemId, undefined);
  assert.equal(obs.resolutionStatus, 'unprocessed');
});

test('review payload uses the real review state-machine contract', () => {
  assert.deepEqual(buildReviewPayload('approve', 'owner@example.com', 'Reviewed'), {
    action: 'approve', actor: 'owner@example.com', reason: 'Reviewed', resume_at: null
  });
});

test('review queue contains only backend OPEN items', () => {
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

test('metrics mapping does not invent unsupported KPI values', () => {
  const result = mapBackendMetrics({ total_observations: 10, total_work_items: 4 }, 3);
  assert.equal(result.activeObservationsToday, 10);
  assert.equal(result.workItemsDiscoveredToday, 4);
  assert.equal(result.pendingReviewCount, 3);
  assert.equal(result.autonomousResolutionRate, 0);
  assert.equal(result.humanInterventionRatio, 0);
  assert.equal(result.meanInferenceLatencyMs, 0);
  assert.equal(result.policyAlignmentScore, 0);
});

test('approval maps to approved and never to published', () => {
  assert.equal(reviewUiStatus('approve'), 'approved');
  assert.equal(reviewUiStatus('reject'), 'rejected');
});

test('local canonical mutations are preview-only', () => {
  assert.equal(shouldUseLocalPreviewMutations(false), false);
  assert.equal(shouldUseLocalPreviewMutations(true), true);
});
