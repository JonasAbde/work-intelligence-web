import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/services/workspace/pickerService.ts', import.meta.url), 'utf8');

test('live Google Picker does not silently fall back when auth or CDN is unavailable', () => {
  assert.equal(source.includes('Caller should fallback'), false);
  assert.equal(source.includes("console.warn('Could not load Google Picker script"), false);
  assert.equal(source.includes('Google Drive authorization required'), true);
});

test('Google Picker does not misuse API key as app id', () => {
  assert.equal(source.includes('.setAppId(apiKey)'), false);
});
