# Phase 4: Deployment & Polish - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

App is production-ready, fully optimized for mobile, and deployed as a complete containerized system. Includes Nginx reverse proxy, self-hosted OSRM routing, error handling with toast notifications, mobile-responsive map and POI interactions, trip sharing via read-only links, and structured logging with health checks.

Requirements: DEPLOY-01, DEPLOY-02, TRIP-05

</domain>

<decisions>
## Implementation Decisions

### Mobile Polish
- **D-01:** Full-screen map toggle on mobile — map starts compact above stop list, tap to expand full-screen with close button. Avoids cramped half-views on small screens.
- **D-02:** POI panel as bottom sheet on mobile — slides up from bottom like Google Maps. Half-height by default, drag up for full. Thumb-friendly, keeps map partially visible.
- **D-03:** Claude's discretion on breakpoints and touch targets — standard responsive breakpoints (768px tablet, 640px phone), 44px minimum touch targets.

### Error Handling UX
- **D-04:** Toast notifications for API/network errors — non-blocking toasts in corner. Auto-dismiss after 5s for warnings, persist for errors until dismissed.
- **D-05:** React ErrorBoundary with friendly error page — catches crashes, shows "Something went wrong" with retry button and travel illustration. Prevents white screen of death.

### Production Docker
- **D-06:** Nginx container as reverse proxy — serves static frontend build, proxies /api to backend. Single entry point on port 80. Handles gzip and caching headers.
- **D-07:** .env.example + documentation for env var management — ship documented .env.example, user copies to .env for secrets. Docker Compose reads .env automatically.
- **D-08:** Self-hosted OSRM container with Europe data extract (~2.5GB) — full routing control, no rate limits. Uses Geofabrik Europe extract.
- **D-09:** Backend routing service must be updated to point to local OSRM container instead of public demo server. Use OSRM_BASE_URL env var (already exists in .env.example).

### Claude's Discretion
- Monitoring/logging: structured JSON logging (pino or morgan), health check endpoints, Docker health checks. Lightweight, no external services.
- Multi-stage Docker builds for production optimization (separate build and runtime stages)
- Nginx configuration details (SSL termination not required for v1, but structure should allow it)
- Toast notification library choice and styling
- Bottom sheet implementation approach (CSS transitions vs library)
- Trip sharing implementation (read-only link format, what's visible to non-authenticated users)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Docs
- `.planning/PROJECT.md` — Core constraints (stack, free-tier APIs, Docker Compose deployment)
- `.planning/REQUIREMENTS.md` — DEPLOY-01, DEPLOY-02, TRIP-05 acceptance criteria
- `.planning/ROADMAP.md` — Phase 4 success criteria (5 items)
- `CLAUDE.md` — Technology stack with exact versions, Docker Compose config

### Prior Phase Context
- `.planning/phases/01-authentication-user-setup/01-CONTEXT.md` — Auth patterns (JWT httpOnly cookies, travel-themed design)
- `.planning/phases/02-trip-stop-management/02-CONTEXT.md` — Split-panel layout (D-04: collapses on mobile), navbar pattern (D-07)

### Existing Docker Config
- `docker-compose.yml` — Current dev-mode setup (3 services: postgres, backend, frontend)
- `backend/Dockerfile` — Dev-only, needs multi-stage production build
- `frontend/Dockerfile` — Dev-only, needs multi-stage production build
- `backend/.env.example` — Existing env vars including OSRM_BASE_URL

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/TripMap.jsx` — Leaflet map, needs mobile full-screen toggle
- `frontend/src/components/POIPanel.jsx` — Fixed overlay, needs bottom sheet variant on mobile
- `frontend/src/components/AppNavBar.jsx` — Top navbar, already in place
- `frontend/src/components/RouteSummary.jsx` — Route distance/duration display
- `frontend/src/services/api.js` — Axios instance, add global error interceptor for toasts
- `backend/src/routing/service.js` — OSRM proxy, already uses OSRM_BASE_URL env var

### Established Patterns
- Zustand with persist middleware for client state
- Axios with withCredentials for API calls
- Tailwind CSS 4 utility classes for styling and responsive design
- Express 5 route mounting (separate router files per domain)
- PostgreSQL with pg module, connection pool

### Integration Points
- `frontend/src/App.jsx` — Add ErrorBoundary wrapper, toast provider, shared trip route
- `frontend/src/pages/TripDetail.jsx` — Mobile responsive adaptations, share button
- `docker-compose.yml` — Add nginx and osrm services, convert to production mode
- `backend/src/index.js` — Add logging middleware, health check endpoint, share routes

</code_context>

<specifics>
## Specific Ideas

- Bottom sheet POI panel should feel like Google Maps on mobile — smooth drag gesture, half-height default
- Map full-screen toggle should be a single tap with smooth transition, not a page reload
- OSRM Europe extract means cross-country road trips work out of the box
- Toast notifications should match the travel theme (not generic browser alerts)
- Error boundary page should have a travel illustration consistent with the app's aesthetic

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-deployment-polish*
*Context gathered: 2026-04-06*
