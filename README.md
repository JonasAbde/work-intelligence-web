# Aftergraph Work Intelligence Web

Production web Experience Runtime for [`Aftergraph/work-intelligence-v2`](https://github.com/Aftergraph/work-intelligence-v2).

## Authority boundary

This repository does **not** own canonical Work Intelligence state.

```text
Browser
  ↓
Work Intelligence Web
  ↓ same-origin /api
least-privilege BFF
  ↓ server-side bearer token
Aftergraph/work-intelligence-v2
```

Non-negotiable invariants:

- `WorkItem != WORKS Work`.
- UI projection is not canonical backend state.
- Approval is not publication or execution.
- Backend failure never enables fixtures automatically.
- Unsupported live writes fail closed.
- Browser code never receives `AFTERGRAPH_API_TOKEN`.

## Runtime modes

### Live mode

Default. Canonical WorkItems, observations, review state, evidence and publication history come from Work Intelligence V2. Provider failures remain failures; they do not silently fall back to local data.

### Explicit preview mode

Append `?preview=1` to the URL. Fixtures and local preview mutations are then allowed and visibly marked as preview. Google Keep currently exists only in this mode.

## Environment

```bash
WORK_INTELLIGENCE_API_URL=http://127.0.0.1:8087
AFTERGRAPH_API_TOKEN=server-side-secret
VITE_WORK_INTELLIGENCE_TENANT_ID=default
VITE_WORK_INTELLIGENCE_REVIEW_ACTOR=work-intelligence-web
```

Never expose the backend bearer token through a `VITE_` environment variable.

## BFF security

The Express BFF is intentionally not an authenticated tunnel to the entire backend. It allowlists only web-required Work Intelligence routes and methods. Backend administration surfaces such as API-key management, migrations, cache mutation, webhook management, tenant-policy mutation and rate-limit management are denied to the browser.

Browser-supplied `Authorization`, `X-API-Key` and cookies are stripped before the server-side backend credential is injected.

## Google Workspace

Browser OAuth access tokens are kept in memory only. Firebase restoring a user session does not imply that a Workspace provider token exists, so the UI does not report Workspace as connected after reload until a fresh provider grant is obtained.

Drive, Gmail, Calendar, Docs and Sheets use live Google APIs when authorized. Provider errors fail closed. Google Keep is preview-only until a supported live connector boundary exists.

The frontend never invents cryptographic evidence hashes for Workspace resources. Authoritative WorkItem evidence is loaded from the backend evidence endpoint.

## Verification

```bash
npm ci
npm test
npm run typecheck
npm run build
```

The CI workflow additionally checks out the backend SHA pinned in `compatibility/work-intelligence-v2.json`, runs its baseline tests, starts the backend, starts the production BFF, then executes `tests/backend-live-contract.test.mjs` through the BFF.

The compatibility test exercises:

- backend health
- observation ingest and listing
- canonical WorkItem list/detail
- allowed actions
- `OPEN → APPROVED`
- transition history
- evidence envelope
- policy-gated WORKS promotion
- missing WorkItem behavior
- version and metrics through the BFF

## Compatibility snapshot

The exact backend SHA used by the cross-repo gate is recorded in:

`compatibility/work-intelligence-v2.json`

Update that pin deliberately when adopting a new backend contract. Do not implicitly track a moving `master` during a production verification run.

## Current external constraints

Hosted GitHub Actions on this repository has recently failed before its first workflow step (`steps=null`). That runner/account infrastructure failure is tracked separately from source-code correctness. A green production claim still requires a successful execution of the full verification workflow or equivalent reproducible evidence on a functioning runner.
