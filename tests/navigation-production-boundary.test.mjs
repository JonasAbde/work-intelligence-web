import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/Navigation.tsx', import.meta.url), 'utf8');

test('Navigation never fabricates production or staging tenant identity', () => {
  assert.equal(source.includes('Acme Global (Production)'), false);
  assert.equal(source.includes('Acme Global (Staging)'), false);
});

test('preview-only Keep and component sandbox are gated by preview mode', () => {
  assert.equal(source.includes("isMockMode ? [{ id: 'keep'"), true);
  assert.equal(source.includes("isMockMode ? [{ id: 'component_registry'"), true);
});
