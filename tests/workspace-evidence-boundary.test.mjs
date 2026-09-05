import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const adapters = await readFile(new URL('../src/runtime/resourceAdapters.ts', import.meta.url), 'utf8');
const inspector = await readFile(new URL('../src/components/Inspector.tsx', import.meta.url), 'utf8');

test('Workspace adapters never fabricate cryptographic evidence hashes', () => {
  assert.equal(adapters.includes('evidenceHash: `sha256:'), false);
  assert.equal(adapters.includes("evidenceHash: 'sha256:"), false);
});

test('Workspace adapters never fabricate corporate email identities', () => {
  assert.equal(adapters.includes('@acme.corp'), false);
});

test('Inspector never labels missing evidence as sha256 verified', () => {
  assert.equal(inspector.includes("'sha256:verified'"), false);
});
