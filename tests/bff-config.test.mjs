import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBackendUrl, backendAuthHeader } from '../server-config.mjs';

test('BFF defaults to authoritative Work Intelligence port 8087', () => {
  assert.equal(resolveBackendUrl({}), 'http://127.0.0.1:8087');
});

test('BFF honors configured backend URL', () => {
  assert.equal(resolveBackendUrl({ WORK_INTELLIGENCE_API_URL: 'https://work.example.com' }), 'https://work.example.com');
});

test('BFF injects backend bearer token server-side only when configured', () => {
  assert.equal(backendAuthHeader({ AFTERGRAPH_API_TOKEN: 'secret' }), 'Bearer secret');
  assert.equal(backendAuthHeader({}), null);
});
