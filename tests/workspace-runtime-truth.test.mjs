import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/runtime/workspaceService.ts', import.meta.url), 'utf8');

test('Workspace runtime does not predeclare providers healthy, scoped or low-latency', () => {
  assert.equal(source.includes("state: 'healthy'"), false);
  assert.equal(source.includes('scopeGranted: true'), false);
  assert.equal(source.includes('latencyMs: 142'), false);
});

test('Workspace runtime does not query a synthetic spreadsheet id in live mode', () => {
  assert.equal(source.includes("fetchSheetDataset('sheet_core_metrics_01')"), false);
});

test('Keep is loaded only in explicit preview mode', () => {
  assert.equal(source.includes('isExplicitPreviewMode'), true);
  assert.equal(source.includes('previewMode ? fetchKeepNotes()'), true);
});

test('provider failures are represented as unavailable instead of silently hidden', () => {
  assert.equal(source.includes("state: 'unavailable'"), true);
});
