import test from 'node:test';
import assert from 'node:assert/strict';
import { applyBackendDetail, mapBackendWorkItem } from '../src/api/contracts.ts';

const base = mapBackendWorkItem({
  id: 'wi_1', tenant_id: 'tenant-a', title: 'Real work', summary: 'Summary', status: 'APPROVED', priority: 'high',
  next_action: 'Publish', confidence: 0.9, canonical_key: 'real-work', canonical_tokens: ['real', 'work'], observation_count: 1,
  created_at: '2026-09-05T10:00:00Z', updated_at: '2026-09-05T10:01:00Z', owner: 'ops@example.com', due_hint: null,
});

test('backend detail enrichment uses only backend-supplied evidence hashes, receipts, transitions and actions', () => {
  const result = applyBackendDetail(base, {
    observations: [{
      id: 'obs_1', tenant_id: 'tenant-a', source: 'gmail', text: 'Please ship', external_id: 'msg-1', actor: 'customer@example.com',
      occurred_at: '2026-09-05T10:00:00Z', created_at: '2026-09-05T10:00:00Z',
    }],
    evidence: {
      schema: 'aftergraph.work-item-evidence/1.0', bundle_id: 'ev_1', provider_id: 'aftergraph.work-intelligence',
      created_at: '2026-09-05T10:02:00Z', algorithm: 'HMAC-SHA256', digest: 'abc123', observations_count: 1,
      identity_chain: { tenant_id: 'tenant-a', work_item_id: 'wi_1', canonical_key: 'real-work', title: 'Real work' },
      records: [{ kind: 'observation', observation_id: 'obs_1', source: 'gmail', external_id: 'msg-1', actor: 'customer@example.com', occurred_at: '2026-09-05T10:00:00Z', text_sha256: 'deadbeef' }],
    },
    publications: [{ id: 'pub_1', work_item_id: 'wi_1', destination: 'renos', external_id: 'RN-1', response: {}, published_at: '2026-09-05T10:03:00Z' }],
    transitions: [{ id: 'tr_1', from_status: 'OPEN', to_status: 'APPROVED', action: 'approve', actor: 'owner@example.com', reason: 'Reviewed', created_at: '2026-09-05T10:01:00Z' }],
    allowedActions: ['publish', 'cancel'],
  });

  assert.deepEqual(result.sourceObservationIds, ['obs_1']);
  assert.equal(result.evidence.length, 1);
  assert.equal(result.evidence[0].hash, 'sha256:deadbeef');
  assert.equal(result.evidence[0].author, 'customer@example.com');
  assert.equal(result.publications[0].target, 'renos');
  assert.equal(result.publications[0].externalReference, 'RN-1');
  assert.equal(result.publications[0].status, 'published');
  assert.equal(result.activity[0].action, 'approve');
  assert.deepEqual(result.allowedActions, ['publish', 'cancel']);
});

test('missing backend evidence never produces a synthetic hash', () => {
  const result = applyBackendDetail(base, { observations: [], evidence: null, publications: [], transitions: [], allowedActions: [] });
  assert.deepEqual(result.evidence, []);
});
