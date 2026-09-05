# Aftergraph Work Intelligence Web

Official web experience for **Aftergraph Work Intelligence V2**.

This repository is the frontend / Experience Runtime. The authoritative work-inference, policy, review, evidence and publication state lives in [`Aftergraph/work-intelligence-v2`](https://github.com/Aftergraph/work-intelligence-v2).

## Architecture

```text
Browser
  ↓
Work Intelligence Web
  ↓ /api
BFF proxy (no domain logic, no durable canonical state)
  ↓
Aftergraph Work Intelligence V2 :8087
  ↓
RenOS / WORKS / configured destinations
```

## Non-negotiable authority boundary

The web app must not create a parallel Work Intelligence backend.

- No durable canonical WorkItem storage in the frontend.
- No frontend-created execution authority.
- `WorkItem` is not the same thing as executable `WORKS Work`.
- Live writes must use an authoritative V2 API contract.
- If V2 has no write contract for an action, live UI fails closed rather than fabricating success.
- Mock/fixture mutations are allowed only in explicit preview mode.
- Browser storage may hold UI preferences/cache only; it is not canonical operational persistence.
- Frontend-computed hashes are not represented as backend evidence.

## Environment

Copy `.env.example` and configure the BFF:

```bash
WORK_INTELLIGENCE_API_URL=http://127.0.0.1:8087
AFTERGRAPH_API_TOKEN=your-server-side-token
VITE_WORK_INTELLIGENCE_TENANT_ID=default
VITE_WORK_INTELLIGENCE_REVIEW_ACTOR=work-intelligence-web
```

`AFTERGRAPH_API_TOKEN` is server-side only. Do not expose it through a `VITE_` variable.

## Development

```bash
npm ci
npm run dev
```

The Vite development server proxies `/api` to the configured development target. Production uses `server.js` as a thin BFF/static server.

## Verification

```bash
npm test
npm run build
npm run lint
```

A successful build is not by itself evidence that live integrations or production runtime behavior are correct. Runtime and backend connectivity must be verified separately.

## Current V2 contract behavior

The frontend is aligned to the current V2 surface including:

- `GET /healthz`
- `GET /healthz/detailed`
- `POST /v1/observations`
- `GET /v1/observations`
- `GET /v1/work-items` with server-side status/priority filtering
- `GET /v1/work-items/{id}`
- `POST /v1/work-items/{id}/review`
- `POST /v1/work-items/{id}/publish`
- `POST /v1/work-items/{id}/promote`
- `GET /v1/work-items/{id}/evidence`
- `GET /v1/work-items/{id}/transitions`
- `GET /v1/work-items/{id}/publications`
- `GET /v1/work-items/{id}/actions`
- `GET /v1/readiness`
- `GET /v1/usage`
- `GET /v1/metrics`
- `GET /v1/monitoring`
- `GET /v1/version`

The current backend also exposes a `/ws` real-time surface, but the web client must not depend on it until authentication, reconnect semantics, and backend broadcast behavior are separately verified. HTTP remains authoritative.

### Remaining product/API gaps

The UI must continue to fail closed for actions without an authoritative contract, notably direct evidence-attachment writes, candidate-merge writes, and provider-specific Google reconnect/sync control. Google Workspace resources may be used as observation sources, but Google provider state is not interchangeable with Work Intelligence canonical state.

## Google AI Studio

Google AI Studio may be used for UI prototyping, but generated claims are not engineering evidence. Keep its GitHub sync pointed at this frontend repository only and never force-push this app over `Aftergraph/work-intelligence-v2`.

Production changes should land through reviewed branches with contract tests and fresh runtime verification rather than AI Studio checkpoints being treated as release evidence.
