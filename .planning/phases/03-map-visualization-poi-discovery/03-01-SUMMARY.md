---
phase: 03-map-visualization-poi-discovery
plan: "01"
subsystem: backend
tags: [routing, osrm, pois, overpass, postgresql, caching]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [routing-endpoint, poi-discovery-endpoint, poi-schema]
  affects: [frontend-map, frontend-poi-panel]
tech_stack:
  added: [overpass-api-integration, osrm-proxy]
  patterns: [cache-first-pattern, multi-row-insert, in-memory-cache]
key_files:
  created:
    - backend/src/routing/service.js
    - backend/src/routing/routes.js
    - backend/src/pois/service.js
    - backend/src/pois/model.js
    - backend/src/pois/routes.js
  modified:
    - backend/src/db/schema.sql
    - backend/src/index.js
    - backend/.env.example
    - .gitignore
    - backend/package-lock.json
decisions:
  - "OSRM coordinate order is [lon, lat] per OSRM spec — enforced in routing/routes.js coordinate mapping"
  - "Overpass queries use POST with url-encoded body to avoid URL length limits for complex queries"
  - "POI cache TTL is 24 hours — DELETE+bulk INSERT approach for atomic cache replacement"
  - "In-memory route cache in routing/service.js avoids redundant OSRM calls within a process lifetime"
  - "Stop ownership verified inline in pois/routes.js via JOIN query (no separate middleware needed for this pattern)"
  - "/pois/categories is public (no JWT) to allow frontend to show category list before auth"
metrics:
  duration_seconds: 239
  completed_date: "2026-04-05"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 5
---

# Phase 3 Plan 01: Backend Routing & POI Discovery Summary

**One-liner:** OSRM routing proxy with in-memory cache and Overpass POI discovery with PostgreSQL 24h cache, serving 3 new REST endpoints.

## What Was Built

### Task 1: POIs Schema + OSRM Routing Service & Endpoint

- **`backend/src/db/schema.sql`** — Appended `pois` table with UUID PK, `stop_id` FK referencing `stops`, full OSM metadata columns (`osm_id`, `osm_type`, `name`, `category`, `lat`, `lon`, `cuisine`, `opening_hours`, `website`, `phone`, `image_url`, `wikimedia_commons`, `cached_at`), plus `idx_pois_stop_id` and `idx_pois_osm_id` indexes.
- **`backend/src/routing/service.js`** — Axios-based OSRM client; reads `OSRM_BASE_URL` env var (defaults to public OSRM demo server); in-memory `routeCache` Map; exports `getRoute(coordinates)` taking `[lon, lat]` pairs (OSRM order).
- **`backend/src/routing/routes.js`** — `GET /:tripId/route` with JWT auth + `requireTripOwner`; fetches trip stops, filters to geocoded ones, returns 400 if < 2, calls `getRoute`, returns 502 on OSRM network error.
- **`backend/.env.example`** — Added `OSRM_BASE_URL` with comment.

### Task 2: Overpass POI Service, Model, Routes + Express Mounting

- **`backend/src/pois/service.js`** — `SEARCH_TERM_MAP` with 15 categories; exports `queryPOIs` (default amenity/tourism/leisure tags), `searchPOIs` (user term with SEARCH_TERM_MAP lookup + fallback name match), `SEARCH_TERM_MAP`, `POI_CATEGORIES`; Overpass POST requests with url-encoded body.
- **`backend/src/pois/model.js`** — `getCachedPOIs` (24h TTL WHERE clause), `cachePOIs` (DELETE + multi-row parameterized INSERT), `getPOIsByStopId`.
- **`backend/src/pois/routes.js`** — `GET /pois/categories` (public), `GET /stops/:stopId/pois` (cache-first with JWT auth), `GET /stops/:stopId/pois/search` (ad-hoc, JWT auth, not cached).
- **`backend/src/index.js`** — Mounted `./routing/routes` at `/api/trips` and `./pois/routes` at `/api`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] node_modules not installed in worktree**
- **Found during:** Task 2 verification (`node -e require` test)
- **Issue:** The git worktree had no `node_modules/` directory; `require('axios')` failed
- **Fix:** Ran `npm install` in `backend/`, committed `package-lock.json`, added `backend/node_modules/` to `.gitignore`
- **Files modified:** `.gitignore`, `backend/package-lock.json`
- **Commit:** 9ce19bf

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 9f5026d | feat(03-01): add pois schema, OSRM routing service and endpoint |
| Task 2 | 9ce19bf | feat(03-01): add POI service, model, routes and mount in Express app |

## API Endpoints Delivered

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/trips/:tripId/route` | JWT | OSRM route with geometry, distance, duration, legs |
| GET | `/api/stops/:stopId/pois` | JWT | Default POIs (cache-first, 24h TTL) |
| GET | `/api/stops/:stopId/pois/search?q=restaurants` | JWT | Ad-hoc POI search by term |
| GET | `/api/pois/categories` | None | List of 15 available search categories |

## Self-Check: PASSED

Files exist:
- backend/src/routing/service.js — FOUND
- backend/src/routing/routes.js — FOUND
- backend/src/pois/service.js — FOUND
- backend/src/pois/model.js — FOUND
- backend/src/pois/routes.js — FOUND

Commits exist:
- 9f5026d — FOUND
- 9ce19bf — FOUND
