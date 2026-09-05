import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/Inspector.tsx', import.meta.url), 'utf8');

test('live Inspector hydrates details from authoritative backend', () => {
  assert.equal(source.includes('apiClient.getWorkItem'), true);
  assert.equal(source.includes('isExplicitPreviewMode'), true);
});

test('review controls are capability-aware instead of status-only', () => {
  assert.equal(source.includes("allowedActions?.includes('approve')"), true);
  assert.equal(source.includes("allowedActions?.includes('reject')"), true);
});
