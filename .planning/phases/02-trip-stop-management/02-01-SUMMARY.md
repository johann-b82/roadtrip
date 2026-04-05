---
phase: 02-trip-stop-management
plan: 01
subsystem: database
tags: [postgresql, sql, crud, unsplash, caching, models]

requires:
  - phase: 01-authentication-user-setup
    provides: users table with UUID PKs, db/connection.js query() pattern
provides:
  - trips table with user ownership and cover photo fields
  - stops table with trip FK, position ordering, address/coords
  - unsplash_cache table with 24h TTL and unique query constraint
  - Trip CRUD model (createTrip, getTripsByUserId, getTripById, updateTrip, deleteTrip)
  - Stop CRUD model with reorderStops (createStop, getStopsByTripId, updateStop, deleteStop, reorderStops)
  - Unsplash cache-first model (getOrSearchUnsplash) and API client (searchUnsplash)
affects: [02-02 trip routes, 02-03 stop routes, 02-04 unsplash routes, 02-05 frontend trip UI]

tech-stack:
  added: [axios]
  patterns: [cache-first with TTL, COALESCE partial update, position-based ordering]

key-files:
  created:
    - backend/src/trips/model.js
    - backend/src/stops/model.js
    - backend/src/unsplash/model.js
    - backend/src/unsplash/client.js
  modified:
    - backend/src/db/schema.sql

key-decisions:
  - "COALESCE-based partial updates for trip and stop editing"
  - "Promise.all parallel position updates for stop reordering"
  - "Unsplash cache upsert with ON CONFLICT for idempotent writes"

patterns-established:
  - "Model files use CommonJS with 'use strict', import { query } from ../db/connection"
  - "Cache-first pattern: check DB cache with TTL, fallback to API, upsert result"
  - "Partial update via COALESCE($N, column) to only overwrite non-null params"

requirements-completed: [TRIP-01, TRIP-02, TRIP-03, TRIP-04, STOP-01, STOP-02, STOP-03, STOP-04, STOP-05, STOP-06, STOP-07]

duration: 1min
completed: 2026-04-05
---

# Phase 02 Plan 01: Schema & Data Models Summary

**PostgreSQL schema extended with trips/stops/unsplash_cache tables and CRUD model layer using cache-first Unsplash strategy**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-05T15:15:11Z
- **Completed:** 2026-04-05T15:16:35Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Extended schema.sql with three new tables (trips, stops, unsplash_cache) preserving all existing auth tables
- Created trip and stop model files with full CRUD operations and ownership-scoped queries
- Implemented Unsplash cache-first model with 24h TTL, upsert on conflict, and graceful API error fallback
- Stop reordering via position column with parallel Promise.all updates

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend schema.sql with trips, stops, and unsplash_cache tables** - `a401c46` (feat)
2. **Task 2: Create trips/model.js, stops/model.js, unsplash/model.js, unsplash/client.js** - `ae21c21` (feat)

## Files Created/Modified
- `backend/src/db/schema.sql` - Added trips, stops, unsplash_cache table definitions with indexes
- `backend/src/trips/model.js` - Trip CRUD with user ownership, stop count aggregation query
- `backend/src/stops/model.js` - Stop CRUD with auto-position assignment, reorderStops
- `backend/src/unsplash/client.js` - Axios client for Unsplash search API (5 landscape photos)
- `backend/src/unsplash/model.js` - Cache-first lookup with 24h TTL, upsert, error fallback

## Decisions Made
- Used COALESCE-based partial updates so callers can update individual fields without overwriting others
- Stop reordering uses Promise.all for parallel position updates (acceptable for small stop counts)
- Unsplash client returns empty results gracefully when UNSPLASH_ACCESS_KEY is not set

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All model files ready for route handlers in plans 02-02 (trip routes) and 02-03 (stop routes)
- Unsplash model ready for 02-04 (unsplash routes)
- Schema ready to be applied via Docker Compose init or migration script

---
*Phase: 02-trip-stop-management*
*Completed: 2026-04-05*
