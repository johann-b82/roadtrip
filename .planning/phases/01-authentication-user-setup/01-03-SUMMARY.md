---
phase: 01-authentication-user-setup
plan: 03
subsystem: api
tags: [geocoding, nominatim, user-profile, express, routes]

# Dependency graph
requires:
  - 01-01 (Express 5 scaffold, PostgreSQL connection)
  - 01-02 (requireAuth middleware, users model with findById/updateHomeLocation)
provides:
  - GET /api/geocoding/search Nominatim proxy with User-Agent header and 5-result limit
  - GET /api/users/me returns authenticated user profile including home location fields
  - PUT /api/users/me/home-location validates and persists home address + coordinates
affects: [01-04, 01-05, phase-02, phase-03]

# Tech tracking
tech-stack:
  added:
    - axios 1.7.x (HTTP client for Nominatim proxy requests)
  patterns:
    - Backend Nominatim proxy pattern (adds required User-Agent, normalizes response)
    - Coordinate validation pattern (lat -90..90, lon -180..180)

# Key files
key-files:
  created:
    - backend/src/geocoding/routes.js (GET /api/geocoding/search Nominatim proxy)
    - backend/src/users/routes.js (GET /api/users/me, PUT /api/users/me/home-location)
  modified:
    - backend/src/index.js (mounted /api/geocoding and /api/users routers)

# Key decisions
decisions:
  - Geocoding endpoint is open (no requireAuth) to support onboarding before full session
  - Nominatim User-Agent set to "RoadTripPlanner/1.0 (contact@roadtrip.app)" per OSM policy
  - Results limited to 5 to minimize Nominatim usage and payload size
  - ECONNABORTED timeout returns 504 (gateway timeout) not 500

# Metrics
metrics:
  duration: "2 minutes"
  completed: "2026-04-05"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 01 Plan 03: Geocoding Proxy and User Profile Routes Summary

Nominatim geocoding proxy at GET /api/geocoding/search plus authenticated user profile endpoints (GET/PUT /api/users/me) wired into the Express app.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Nominatim geocoding proxy | e8c11b8 | backend/src/geocoding/routes.js (created) |
| 2 | User profile routes + mount all new routers | eb0892f | backend/src/users/routes.js (created), backend/src/index.js (modified) |

## What Was Built

### Task 1: Nominatim Geocoding Proxy

Created `backend/src/geocoding/routes.js` with a single route:

- `GET /api/geocoding/search?q=address` — proxies to Nominatim's search endpoint
- Adds required `User-Agent: RoadTripPlanner/1.0 (contact@roadtrip.app)` header per OSM usage policy
- Limits results to 5 entries
- Normalizes response to: `osm_id`, `display_name`, `lat` (float), `lon` (float), `type`, `address`
- Open endpoint (no auth) — required during onboarding before session is established
- Handles timeout (`ECONNABORTED`) with 504 and upstream errors with 502

### Task 2: User Profile Routes + Router Mounting

Created `backend/src/users/routes.js` with two routes:

- `GET /api/users/me` — returns authenticated user's profile fields (`id`, `email`, `home_address`, `home_lat`, `home_lon`, `created_at`)
- `PUT /api/users/me/home-location` — validates address/lat/lon and saves to PostgreSQL via `updateHomeLocation`
  - Validates lat in range -90 to 90
  - Validates lon in range -180 to 180
  - Both routes protected by `requireAuth` middleware

Updated `backend/src/index.js` to mount both new routers:
- `app.use('/api/geocoding', require('./geocoding/routes'))`
- `app.use('/api/users', require('./users/routes'))`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all endpoints are fully implemented. The routes depend on `backend/src/auth/middleware.js` and `backend/src/users/model.js` which are created by plan 01-02 (parallel execution).

## Self-Check: PASSED

Files exist:
- backend/src/geocoding/routes.js: FOUND
- backend/src/users/routes.js: FOUND

Commits exist:
- e8c11b8: FOUND (feat(01-03): implement Nominatim geocoding proxy endpoint)
- eb0892f: FOUND (feat(01-03): add user profile routes and mount routers in Express app)
