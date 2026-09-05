import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const service = await readFile(new URL('../src/runtime/telemetry.ts', import.meta.url), 'utf8');
const hud = await readFile(new URL('../src/components/workspace/TelemetryHUD.tsx', import.meta.url), 'utf8');

test('UX telemetry starts empty and never fabricates baseline latency or conversion', () => {
  assert.equal(service.includes("this.record('time_to_resource'"), false);
  assert.equal(service.includes("this.record('search_performed'"), false);
  assert.equal(service.includes(': 180'), false);
  assert.equal(service.includes(': 840'), false);
  assert.equal(service.includes(': 100'), false);
});

test('HUD describes local interaction telemetry, not backend live runtime telemetry', () => {
  assert.equal(hud.includes('Live Runtime'), false);
  assert.equal(hud.includes('Privacy Safe'), false);
  assert.equal(hud.includes('JSON.stringify(ev.details)'), false);
});
