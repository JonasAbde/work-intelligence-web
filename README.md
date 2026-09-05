# Aftergraph Work Intelligence Web

Official web experience for **Aftergraph Work Intelligence V2**.

This repository is the frontend / Experience Runtime. The authoritative work-inference, policy, review, evidence and publication state lives in [`Aftergraph/work-intelligence-v2`](https://github.com/Aftergraph/work-intelligence-v2).

## Architecture

```text
Browser
  ↓
Work Intelligence Web
  ↓ /api
BFF proxy (no domain logic, no durable state)
  ↓
Aftergraph Work Intelligence V2 :8087
  ↓
RenOS / WORKS / configured destinations
```

### Non-negotiable boundary

The web app must not create a parallel Work Intelligence backend.

- No durable canonical WorkItem storage in the frontend.
- No frontend-created execution authority.
- `WorkItem` is not the same thing as executable `WORKS Work`.
- Live writes must use an authoritative V2 API contract.
- If V2 has no write contract for an action, live UI fails closed rather than fabricating success.
- Mock/fixture mutations are allowed only in explicit preview mode.

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
```

Contract tests protect the boundary between the web app and the authoritative V2 API.

## Current V2 contract behavior

The frontend uses:

- `GET /healthz`
- `POST /v1/observations`
- `GET /v1/work-items`
- `GET /v1/work-items/{id}`
- `POST /v1/work-items/{id}/review`
- `POST /v1/work-items/{id}/publish`
- `POST /v1/work-items/{id}/promote`
- `GET /v1/work-items/{id}/evidence`
- `GET /v1/metrics`
- `GET /v1/monitoring`
- `GET /v1/version`

Known backend gaps are handled explicitly rather than emulated as production state: global observation listing, integration reconnect/health control, evidence attachment writes and candidate merge writes.

## Google AI Studio

Google AI Studio may be used to evolve the frontend UI/UX. Keep its GitHub sync pointed at this frontend repository only. Never force-push this app over `Aftergraph/work-intelligence-v2`.
