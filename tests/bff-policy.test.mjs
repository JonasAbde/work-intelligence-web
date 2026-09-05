import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedWebApiRequest } from '../server-policy.mjs';

const allow = [
  ['GET', '/healthz'],
  ['GET', '/healthz/detailed'],
  ['POST', '/v1/observations'],
  ['GET', '/v1/observations?tenant_id=default'],
  ['GET', '/v1/work-items?tenant_id=default'],
  ['GET', '/v1/work-items/wi_1?tenant_id=default'],
  ['POST', '/v1/work-items/wi_1/review?tenant_id=default'],
  ['POST', '/v1/work-items/wi_1/publish?tenant_id=default'],
  ['POST', '/v1/work-items/wi_1/promote?tenant_id=default'],
  ['GET', '/v1/work-items/wi_1/evidence?tenant_id=default'],
  ['GET', '/v1/work-items/wi_1/transitions?tenant_id=default'],
  ['GET', '/v1/work-items/wi_1/publications?tenant_id=default'],
  ['GET', '/v1/work-items/wi_1/actions?tenant_id=default'],
  ['GET', '/v1/readiness'],
  ['GET', '/v1/usage'],
  ['GET', '/v1/metrics'],
  ['GET', '/v1/monitoring'],
  ['GET', '/v1/version'],
];

for (const [method, path] of allow) {
  test(`BFF allows ${method} ${path}`, () => assert.equal(isAllowedWebApiRequest(method, path), true));
}

const deny = [
  ['POST', '/v1/api-keys'],
  ['GET', '/v1/api-keys'],
  ['POST', '/v1/migrations/run'],
  ['POST', '/v1/cache/clear'],
  ['POST', '/v1/rate-limit'],
  ['POST', '/v1/webhooks'],
  ['DELETE', '/v1/tenants/default/policy'],
  ['POST', '/v1/tenants/default/policy'],
  ['GET', '/dashboard'],
  ['GET', '/docs'],
  ['POST', '/v1/work-items/wi_1/evidence'],
  ['DELETE', '/v1/work-items/wi_1'],
];

for (const [method, path] of deny) {
  test(`BFF denies ${method} ${path}`, () => assert.equal(isAllowedWebApiRequest(method, path), false));
}
