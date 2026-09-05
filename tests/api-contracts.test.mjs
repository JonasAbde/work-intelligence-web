import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRoutes,
  mapBackendWorkItem,
  mapBackendObservation,
  mapBackendMetrics,
  buildReviewPayload,
  deriveReviewQueue,
} from '../src/api/contracts.ts';

const routes = buildRoutes('/api', 'tenant-a');

test('routes match authoritative Work Intelligence V2 API', () => {
  assert.equal(routes.health, '/api/healthz');
  assert.equal(routes.workItems(100), '/api/v1/work-items?tenant_id=tenant-a&limit=100');
  assert.equal(routes.workItem('wi_123'), '/api/v1/work-items/wi_123?tenant_id=tenant-a');
  assert.equal(routes.review('wi_123'), '/api/v1/work-items/wi_123/review?tenant_id=tenant-a');
  assert.equal(routes.metrics, '/api/v1/metrics');
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

test('backend observations map into source-neutral UI observations', () => {
  const obs = mapBackendObservation({
    id: 'obs_1', tenant_id: 'tenant-a', source: 'email', text: 'Please send confirmation',
    external_id: 'msg-1', actor: 'customer@example.com', occurred_at: '2026-09-05T10:00:00Z', created_at: '2026-09-05T10:00:01Z', metadata: {}
  }, 'wi_123');
  assert.equal(obs.source, 'gmail');
  assert.equal(obs.linkedWorkItemId, 'wi_123');
  assert.equal(obs.rawText, 'Please send confirmation');
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

test('metrics mapping uses real backend counters without fabricating latency or policy scores', () => {
  const result = mapBackendMetrics({ total_ingested: 10, total_candidates: 4, total_approved: 2, total_published: 1, total_rejected: 1, total_cancelled: 0, total_snoozed: 0, total_promoted: 1, by_status: {}, by_source: {} }, 3);
  assert.equal(result.activeObservationsToday, 10);
  assert.equal(result.workItemsDiscoveredToday, 4);
  assert.equal(result.pendingReviewCount, 3);
  assert.equal(result.meanInferenceLatencyMs, 0);
  assert.equal(result.policyAlignmentScore, 0);
});
