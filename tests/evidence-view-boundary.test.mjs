import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/views/EvidenceGraphView.tsx', import.meta.url), 'utf8');

test('Evidence view never fabricates hashes, signatures, algorithms, timings or publication receipts', () => {
  for (const forbidden of [
    'sha256:workspace_genesis',
    'sha256:root',
    'obs:valid_signature',
    'intent:verified',
    'dispatch:ack_received',
    'ECDSA-P256-SHA256',
    '+220ms',
    '+310ms',
    '+120ms',
    '+850ms',
  ]) {
    assert.equal(source.includes(forbidden), false, `forbidden fabricated evidence marker: ${forbidden}`);
  }
});

test('Evidence view does not call evidence immutable or verified without backend evidence', () => {
  assert.equal(source.includes('Immutable Audit Log Entry'), false);
  assert.equal(source.includes('verified records'), false);
  assert.equal(source.includes("'sha256:verified'"), false);
});
