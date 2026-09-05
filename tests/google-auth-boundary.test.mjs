import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const authSource = await readFile(new URL('../src/services/workspace/googleAuth.ts', import.meta.url), 'utf8');

test('Google Workspace access tokens remain memory-only', () => {
  assert.equal(authSource.includes('sessionStorage'), false);
  assert.equal(authSource.includes('localStorage'), false);
});

test('OAuth config avoids broad duplicate Google scopes', () => {
  assert.equal(authSource.includes('https://mail.google.com/'), false);
  assert.equal(authSource.includes('https://www.googleapis.com/auth/drive.readonly'), false);
  assert.equal(authSource.includes('https://www.googleapis.com/auth/drive.metadata.readonly'), false);
  assert.equal(authSource.includes('https://www.googleapis.com/auth/gmail.readonly'), false);
  assert.equal(authSource.includes('https://www.googleapis.com/auth/gmail.compose'), false);
  assert.equal(authSource.includes('https://www.googleapis.com/auth/calendar.readonly'), false);
  assert.equal(authSource.includes('https://www.googleapis.com/auth/spreadsheets.readonly'), false);
  assert.equal(authSource.includes('https://www.googleapis.com/auth/documents.readonly'), false);
});

test('Firebase-authenticated user is not reported as Workspace-connected without a provider access token', () => {
  assert.equal(authSource.includes("onAuthSuccess(user, '')"), false);
  assert.equal(authSource.includes('onAuthFailure?.()'), true);
});
