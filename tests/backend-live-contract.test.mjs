import test from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.LIVE_BACKEND_URL;
const tenant = `compat-${Date.now()}`;

async function request(path, init = {}) {
  const response = await fetch(`${base}${path}`, init);
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { response, body };
}

const live = base ? test : test.skip;

live('cross-repo BFF/backend contract: health → ingest → list → review → evidence → actions', async () => {
  const health = await request('/healthz');
  assert.equal(health.response.status, 200);
  assert.equal(health.body?.service, 'aftergraph-work-intelligence');
  assert.ok(['ok', 'degraded'].includes(health.body?.status));

  const externalId = `compat:${Date.now()}`;
  const ingest = await request('/v1/observations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenant_id: tenant,
      source: 'conversation',
      text: `Compatibility verification requires a human review ${externalId}`,
      external_id: externalId,
      actor: 'compatibility-gate',
      title_hint: `Compatibility gate ${externalId}`,
      priority_hint: 'high',
      metadata: { test: 'cross-repo-compatibility' },
    }),
  });
  assert.ok([200, 201, 202].includes(ingest.response.status), `ingest status ${ingest.response.status}`);
  assert.ok(ingest.body?.observation?.id);
  assert.ok(ingest.body?.work_item?.id, 'compatibility observation must resolve to a WorkItem');
  const workItemId = ingest.body.work_item.id;

  const observations = await request(`/v1/observations?tenant_id=${encodeURIComponent(tenant)}&limit=100`);
  assert.equal(observations.response.status, 200);
  assert.ok(observations.body?.observations?.some(item => item.id === ingest.body.observation.id));

  const workItems = await request(`/v1/work-items?tenant_id=${encodeURIComponent(tenant)}&limit=100`);
  assert.equal(workItems.response.status, 200);
  assert.ok(workItems.body?.work_items?.some(item => item.id === workItemId));

  const detail = await request(`/v1/work-items/${encodeURIComponent(workItemId)}?tenant_id=${encodeURIComponent(tenant)}`);
  assert.equal(detail.response.status, 200);
  assert.equal(detail.body?.work_item?.id, workItemId);

  const beforeActions = await request(`/v1/work-items/${encodeURIComponent(workItemId)}/actions?tenant_id=${encodeURIComponent(tenant)}`);
  assert.equal(beforeActions.response.status, 200);
  assert.ok(beforeActions.body?.actions?.includes('approve'));

  const review = await request(`/v1/work-items/${encodeURIComponent(workItemId)}/review?tenant_id=${encodeURIComponent(tenant)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve', actor: 'compatibility-gate', reason: 'Cross-repo compatibility test', resume_at: null }),
  });
  assert.equal(review.response.status, 200);
  assert.equal(String(review.body?.status).toUpperCase(), 'APPROVED');

  const transitions = await request(`/v1/work-items/${encodeURIComponent(workItemId)}/transitions?tenant_id=${encodeURIComponent(tenant)}`);
  assert.equal(transitions.response.status, 200);
  assert.ok(transitions.body?.transitions?.some(entry => String(entry.to_status).toUpperCase() === 'APPROVED'));

  const evidence = await request(`/v1/work-items/${encodeURIComponent(workItemId)}/evidence?tenant_id=${encodeURIComponent(tenant)}`);
  assert.equal(evidence.response.status, 200);
  assert.ok(evidence.body, 'backend must return an evidence envelope');

  const afterActions = await request(`/v1/work-items/${encodeURIComponent(workItemId)}/actions?tenant_id=${encodeURIComponent(tenant)}`);
  assert.equal(afterActions.response.status, 200);
  assert.ok(afterActions.body?.actions?.includes('publish'));

  const promote = await request(`/v1/work-items/${encodeURIComponent(workItemId)}/promote?tenant_id=${encodeURIComponent(tenant)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor: 'compatibility-gate', reason: 'Must remain policy-gated' }),
  });
  assert.equal(promote.response.status, 403, 'WORKS promotion must fail closed without an allow_works tenant policy');

  const missing = await request(`/v1/work-items/not-real?tenant_id=${encodeURIComponent(tenant)}`);
  assert.equal(missing.response.status, 404);
});

live('BFF exposes backend version and metrics without client-side credentials', async () => {
  const version = await request('/v1/version');
  assert.equal(version.response.status, 200);
  assert.ok(version.body?.version);

  const metrics = await request('/v1/metrics');
  assert.equal(metrics.response.status, 200);
  assert.equal(typeof metrics.body?.total_observations, 'number');
});
