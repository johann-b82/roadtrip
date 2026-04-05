# Phase 4: Deployment & Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 04-deployment-polish
**Areas discussed:** Mobile polish, Error handling UX, Production Docker

---

## Mobile Polish

### Map behavior on mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen toggle | Map starts compact, tap to expand full-screen with close button | Yes |
| Tabbed view | Tabs switch between Stops and Map views | |
| Stacked scroll | Map at fixed height above scrollable stop list | |

**User's choice:** Full-screen toggle (Recommended)
**Notes:** None

### POI panel on mobile

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom sheet | Slides up from bottom, half-height default, drag up for full | Yes |
| Full-screen overlay | Takes over whole screen on mobile | |
| Keep current overlay | Same side panel as desktop, narrower | |

**User's choice:** Bottom sheet (Recommended)
**Notes:** None

### Mobile breakpoints and touch gestures

| Option | Description | Selected |
|--------|-------------|----------|
| You decide | Standard breakpoints (768px, 640px), 44px min touch targets | Yes |
| Phone-first priority | Optimize for 375-414px, aggressive space-saving | |

**User's choice:** You decide (Recommended)
**Notes:** None

---

## Error Handling UX

### Error notification style

| Option | Description | Selected |
|--------|-------------|----------|
| Toast notifications | Non-blocking corner toasts, auto-dismiss 5s warnings, persist errors | Yes |
| Inline messages | Error below failed action, per-component | |
| Both | Inline for forms, toasts for network/API | |

**User's choice:** Toast notifications (Recommended)
**Notes:** None

### Crash recovery (ErrorBoundary)

| Option | Description | Selected |
|--------|-------------|----------|
| Friendly error page | ErrorBoundary with travel illustration, retry button | Yes |
| Minimal fallback | Simple "Reload page" message | |

**User's choice:** Friendly error page (Recommended)
**Notes:** None

---

## Production Docker

### Nginx reverse proxy

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, Nginx container | Serves static frontend, proxies /api to backend, port 80 | Yes |
| No, keep separate ports | Frontend :5173, backend :3001 as-is | |

**User's choice:** Yes, Nginx container (Recommended)
**Notes:** None

### Environment variable management

| Option | Description | Selected |
|--------|-------------|----------|
| .env.example + docs | Documented .env.example, user copies to .env | Yes |
| Docker secrets | Docker secrets for sensitive values | |
| You decide | Claude picks simplest secure approach | |

**User's choice:** .env.example + docs (Recommended)
**Notes:** None

### OSRM hosting

| Option | Description | Selected |
|--------|-------------|----------|
| Public demo server | Keep router.project-osrm.org, zero setup | |
| Self-hosted OSRM container | Docker service with region data extract | Yes |

**User's choice:** Self-hosted OSRM container
**Notes:** None

### OSRM region data

| Option | Description | Selected |
|--------|-------------|----------|
| Germany | ~500MB extract | |
| Europe | ~2.5GB extract, covers cross-country trips | Yes |
| Configurable via env var | Default Germany, OSRM_REGION env var for any region | |

**User's choice:** Europe
**Notes:** None

### Monitoring and logging

| Option | Description | Selected |
|--------|-------------|----------|
| You decide | Structured JSON logging, health checks, Docker health checks | Yes |
| Grafana/Loki stack | Full log aggregation and dashboards | |

**User's choice:** You decide (Recommended)
**Notes:** None

---

## Claude's Discretion

- Mobile breakpoints and touch target sizing
- Monitoring/logging implementation (structured logging, health checks)
- Multi-stage Docker build details
- Toast library choice and styling
- Bottom sheet implementation approach
- Trip sharing link format and implementation
- Nginx configuration specifics

## Deferred Ideas

None
