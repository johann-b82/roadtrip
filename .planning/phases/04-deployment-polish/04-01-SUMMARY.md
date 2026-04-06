---
phase: 04-deployment-polish
plan: 01
subsystem: infra
tags: [docker, docker-compose, nginx, osrm, multi-stage-build, healthcheck]

requires:
  - phase: 01-authentication-user-setup
    provides: backend Express app with /health endpoint and JWT env vars
  - phase: 03-map-poi
    provides: backend routing service consuming OSRM_BASE_URL
provides:
  - Multi-stage backend Dockerfile (node:22-alpine builder + prod-only runtime)
  - Multi-stage frontend Dockerfile (Vite build + nginx:1.27-alpine serve)
  - frontend/nginx.conf with SPA try_files routing and 1y asset cache
  - Standalone nginx reverse proxy container with gzip and /api + /auth proxy_pass
  - Self-hosted OSRM container with Geofabrik Europe extract auto-bootstrap
  - 5-service production docker-compose.yml with healthchecks and depends_on conditions
  - Root .env.example with required-var fail-fast and documentation
affects: [04-02-error-resilience, 04-03-mobile-responsive, 04-04-launch]

tech-stack:
  added: [nginx:1.27-alpine, osrm/osrm-backend]
  patterns:
    - Multi-stage Docker builds (builder + runtime image)
    - Docker healthchecks gating depends_on with service_healthy
    - Required env vars via ${VAR:?error message} fail-fast syntax
    - Reverse proxy as single port-80 entry point in front of frontend + backend
    - One-time data bootstrap script (download + extract + partition + customize) for OSRM

key-files:
  created:
    - frontend/nginx.conf
    - nginx/Dockerfile
    - nginx/nginx.conf
    - osrm/Dockerfile
    - osrm/start.sh
    - .env.example
  modified:
    - backend/Dockerfile
    - frontend/Dockerfile
    - docker-compose.yml

key-decisions:
  - "Multi-stage Dockerfiles (builder + runtime) to slim production images and exclude dev deps"
  - "Standalone nginx container as single entry on port 80, front of frontend + backend"
  - "Frontend container also runs nginx (frontend/nginx.conf) so SPA routing works in isolation; reverse-proxy container proxies to it"
  - "Self-hosted OSRM with Geofabrik europe-latest.osm.pbf instead of public demo (no SLA, rate limited)"
  - "Required env vars use \${VAR:?error} syntax so docker compose up fails fast on missing secrets"
  - "Removed dev volume mounts and dev CMDs; production runs npm start and pre-built static assets"

patterns-established:
  - "Docker healthcheck pattern: HEALTHCHECK on every Dockerfile + healthcheck block in compose + service_healthy depends_on"
  - "Two-tier nginx: per-app nginx in frontend image for SPA routing; reverse-proxy nginx in front of all services"
  - "OSRM bootstrap idempotency via [ ! -f ] guards on each pipeline stage output"

requirements-completed: [DEPLOY-01, DEPLOY-02]

duration: ~6min
completed: 2026-04-06
---

# Phase 04 Plan 01: Production Docker Stack Summary

**5-service Docker Compose stack (postgres, osrm, backend, frontend, nginx) with multi-stage builds, self-hosted OSRM Europe routing, and nginx reverse proxy on port 80**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-06T08:30:00Z
- **Completed:** 2026-04-06T08:36:00Z
- **Tasks:** 3
- **Files modified:** 9 (3 modified, 6 created)

## Accomplishments
- Backend and frontend Dockerfiles converted from single-stage dev to multi-stage production builds
- Frontend now compiles via Vite and is served by `nginx:1.27-alpine` with SPA routing and 1y asset cache
- Standalone nginx reverse proxy container with gzip and `/api` + `/auth` proxy_pass to backend:3001
- Self-hosted OSRM container that auto-downloads Geofabrik Europe extract on first run and bootstraps the MLD pipeline
- Production `docker-compose.yml` with 5 services, healthchecks on every service, and `service_healthy` gated `depends_on`
- Root-level `.env.example` documenting all required and optional env vars with fail-fast `${VAR:?error}` references

## Task Commits

Each task was committed atomically:

1. **Task 1: Multi-stage Dockerfiles for backend and frontend** - `91b173b` (feat)
2. **Task 2: Nginx reverse proxy and OSRM startup scripts** - `d52e789` (feat)
3. **Task 3: Production docker-compose.yml and root .env.example** - `fcea6a7` (feat)

## Files Created/Modified
- `backend/Dockerfile` - Multi-stage builder + prod runtime with HEALTHCHECK and `npm start`
- `frontend/Dockerfile` - Vite build stage then `nginx:1.27-alpine` serve stage
- `frontend/nginx.conf` - Per-frontend-image nginx config: SPA `try_files`, 1y immutable cache for hashed assets
- `nginx/Dockerfile` - Reverse proxy image based on `nginx:1.27-alpine`
- `nginx/nginx.conf` - Gzip, upstream backend/frontend, `location /api/` and `location /auth/` `proxy_pass http://backend`
- `osrm/Dockerfile` - `osrm/osrm-backend` with wget, start script, 5000/tcp, healthcheck
- `osrm/start.sh` - Idempotent download → extract → partition → customize → `osrm-routed --algorithm=MLD`
- `docker-compose.yml` - 5 services with healthchecks, `service_healthy` depends_on, fail-fast required env vars
- `.env.example` - Root-level docs for POSTGRES_*, JWT_*, RESEND_API_KEY, FRONTEND_URL, OSRM_BASE_URL, UNSPLASH_ACCESS_KEY, LOG_LEVEL

## Decisions Made
- Added an `upstream frontend` block in `nginx/nginx.conf` (resolves to `frontend:80`) so the `proxy_pass http://frontend` directive in the root location works against the frontend container's nginx server. The plan referenced `proxy_pass http://frontend` without defining the upstream — this is required for nginx to resolve it. Tracked as a minor Rule 3 fix.
- Kept `restart: unless-stopped` on all services so containers recover on host reboot.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing `upstream frontend` block in nginx/nginx.conf**
- **Found during:** Task 2 (nginx config authoring)
- **Issue:** The plan's nginx config used `proxy_pass http://frontend;` in `location /` but did not define a `frontend` upstream. Nginx would resolve `http://frontend` directly via DNS at runtime, but defining it explicitly via an `upstream` block matches the existing `upstream backend` pattern and makes the config consistent.
- **Fix:** Added `upstream frontend { server frontend:80; }` next to the existing `upstream backend` block.
- **Files modified:** nginx/nginx.conf
- **Verification:** Both upstreams declared; `proxy_pass http://frontend` and `proxy_pass http://backend` resolve consistently.
- **Committed in:** d52e789 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 blocking)
**Impact on plan:** Trivial consistency fix; no scope creep, no behavior change beyond what the plan intended.

## Issues Encountered
- `docker compose config` validation could not be run locally (Docker CLI not present in execution environment). YAML structure was hand-verified against the plan spec and against the compose schema; all required indicators (`service_healthy` ×5, `osrm:`, `nginx:`, `"80:80"`, `osrmdata:`) are present.

## User Setup Required
None for this plan — all configuration is via `.env.example`. On deploy, the user must:
1. `cp .env.example .env` and fill in `POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (compose will fail-fast otherwise).
2. First `docker compose up` will trigger OSRM Europe extract download (~2.5GB) and a 15–30 minute one-time `osrm-extract`/`partition`/`customize` build. Subsequent starts reuse the `osrmdata` volume.

## Next Phase Readiness
- Production Docker stack ready for plans 04-02 (error resilience), 04-03 (mobile responsive), 04-04 (launch).
- The reverse proxy assumes backend exposes routes under `/api/` and `/auth/`; if any route lives outside these prefixes it will hit the frontend SPA fallback. Plans 04-02/04-04 should verify route prefixes.

---
*Phase: 04-deployment-polish*
*Completed: 2026-04-06*

## Self-Check: PASSED

All 9 created/modified files exist on disk. All 3 task commits (91b173b, d52e789, fcea6a7) exist in git history.
