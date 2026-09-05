import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isExplicitPreviewSearch } from '../src/runtime/runtimeMode.ts';

const providerFiles = ['driveApi.ts', 'gmailApi.ts', 'calendarApi.ts', 'docsApi.ts', 'sheetsApi.ts', 'keepApi.ts'];

for (const file of providerFiles) {
  test(`${file} requires explicit preview before local fixtures can be used`, async () => {
    const source = await readFile(new URL(`../src/services/workspace/${file}`, import.meta.url), 'utf8');
    assert.equal(source.includes('isExplicitPreviewMode'), true);
  });
}

test('preview mode is opt-in only', () => {
  assert.equal(isExplicitPreviewSearch(''), false);
  assert.equal(isExplicitPreviewSearch('?preview=0'), false);
  assert.equal(isExplicitPreviewSearch('?foo=1'), false);
  assert.equal(isExplicitPreviewSearch('?preview=1'), true);
  assert.equal(isExplicitPreviewSearch('?foo=1&preview=1'), true);
});
