import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');

test('App never persists canonical Work Intelligence state in browser storage', () => {
  for (const key of ['WORK_ITEMS', 'OBSERVATIONS', 'REVIEW_QUEUE', 'INTEGRATIONS', 'METRICS']) {
    assert.equal(source.includes(`STORAGE_KEYS.${key}`), false);
  }
});

test('live backend failure never enables mock mode', () => {
  assert.equal(source.includes("setConnectionState('unavailable');\n      setIsMockMode(true)"), false);
  assert.equal(source.includes('isExplicitPreviewMode'), true);
});

test('Workspace promotion uses authoritative observation ingestion and does not fabricate SHA-256 evidence', () => {
  assert.equal(source.includes('apiClient.ingestObservation'), true);
  assert.equal(source.includes('sha256:'), false);
});

test('approval never equates APPROVED with PUBLISHED', () => {
  assert.equal(source.includes("status: 'published'"), false);
});
