---
phase: 04-deployment-polish
plan: 02
subsystem: backend-observability-sharing
tags: [logging, health-check, jwt, sharing, pino]
requires:
  - backend/src/db/connection.js (query)
  - backend/src/auth/middleware.js (requireAuth)
  - backend/src/trips/middleware.js (requireTripOwner)
  - backend/src/stops/model.js (getStopsByTripId)
  - jsonwebtoken
provides:
  - structured JSON request logging (pino + pino-http)
  - GET /health with PostgreSQL connectivity verification
  - POST /api/trips/:tripId/share (signed JWT share link, 7d expiry)
  - GET /api/trips/shared/:token (public trip viewer)
affects:
  - backend/src/index.js (middleware order, log replacement)
tech-stack:
  added:
    - pino ^9.0.0
    - pino-http ^10.0.0
    - pino-pretty ^11.0.0 (dev transport)
  patterns:
    - JWT-signed share tokens via existing JWT_SECRET
    - Express route ordering: /shared/:token before /:id
    - Health check: 200 healthy / 503 unhealthy
key-files:
  created:
    - backend/src/logging/logger.js
    - backend/src/health/routes.js
  modified:
    - backend/src/index.js
    - backend/src/trips/routes.js
    - backend/package.json
decisions:
  - Use pino over winston (faster, JSON-native, recommended for Node 22)
  - Skip /health from autoLogging to reduce noise from container probes
  - Share token expiry 7 days (balance UX vs security)
  - Reuse existing JWT_SECRET (no separate share secret) for simplicity
metrics:
  duration_minutes: 4
  tasks_completed: 3
  files_changed: 5
  completed_date: 2026-04-06
---

# Phase 4 Plan 2: Logging, Health Check & Trip Sharing Summary

Production observability via pino structured logging plus a real DB-checking /health endpoint, and read-only trip sharing through signed 7-day JWT links (TRIP-05).

## What Was Built

1. **Pino structured logging** — `backend/src/logging/logger.js` exports `logger` and `httpLogger`. Dev mode uses `pino-pretty` for human-readable output; production emits raw JSON for log aggregators. `httpLogger` ignores `/health` to silence container probe noise and maps 5xx → error, 4xx → warn.

2. **Real /health endpoint** — `backend/src/health/routes.js` runs `SELECT 1` against PostgreSQL. Returns `200 {status:'healthy', timestamp}` on success or `503 {status:'unhealthy', error, timestamp}` on DB failure. Mounted at `/health` in `index.js`.

3. **Trip share API** — Added two routes to `backend/src/trips/routes.js`:
   - `POST /api/trips/:tripId/share` (auth+owner): signs `{trip_id, shared_at}` with JWT_SECRET, 7d expiry, returns `{shareUrl, expiresIn}`.
   - `GET /api/trips/shared/:token` (public): verifies token, returns `{trip, stops, isShared:true}` or 401 on invalid/expired token, 404 if trip missing. Registered **before** `/:id` to avoid Express path collision on the literal `shared`.

4. **index.js wiring** — `httpLogger` mounted first, console.error/console.log replaced with `logger.error` / `logger.info`.

## Tasks & Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Pino logging middleware | c9397c8 | backend/package.json, backend/src/logging/logger.js |
| 2 | Health endpoint + share API | f49461b | backend/src/health/routes.js, backend/src/trips/routes.js |
| 3 | Wire logging + health into index | 4a8375a | backend/src/index.js |

## Acceptance Criteria

- [x] backend/src/logging/logger.js exports logger and httpLogger
- [x] backend/src/health/routes.js returns 503 when DB unavailable
- [x] backend/src/trips/routes.js has /shared/:token before /:id
- [x] backend/src/index.js uses httpLogger as first middleware
- [x] backend/package.json includes pino and pino-http
- [x] console.* removed from index.js error handler and listen callback

## Deviations from Plan

**[Rule 3 - Blocking]** Added `pino-pretty` (^11.0.0) to backend dependencies. The plan only listed `pino` and `pino-http`, but the dev-mode logger configuration sets `transport: { target: 'pino-pretty' }`. Without it installed, dev startup would crash. Production emits raw JSON and does not need pino-pretty, but it must be a regular dependency (not dev-only) because logger.js loads it at runtime when NODE_ENV !== 'production'.

## Known Stubs

None.

## Notes for Frontend (TRIP-05)

The shared trip viewer route `/trips/shared/:token` must be added to the React Router config in a follow-up plan and should call `GET /api/trips/shared/:token` (no credentials needed). The response includes `isShared: true` so the UI can hide edit affordances.

## Self-Check: PASSED

- FOUND: backend/src/logging/logger.js
- FOUND: backend/src/health/routes.js
- FOUND: backend/src/index.js (modified)
- FOUND: backend/src/trips/routes.js (modified)
- FOUND: backend/package.json (modified)
- FOUND commit: c9397c8
- FOUND commit: f49461b
- FOUND commit: 4a8375a
