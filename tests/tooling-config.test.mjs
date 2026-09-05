import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('verification scripts only invoke installed tooling', () => {
  assert.equal(pkg.scripts.typecheck, 'tsc --noEmit');
  assert.equal(pkg.scripts.verify, 'npm test && npm run typecheck && npm run build');
  if (pkg.scripts.lint?.includes('eslint')) {
    assert.ok(pkg.devDependencies?.eslint, 'eslint script requires eslint dependency');
  }
});
