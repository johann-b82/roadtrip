---
phase: 04-deployment-polish
plan: 04
subsystem: frontend-sharing
tags: [sharing, public-route, clipboard, sonner, jwt]
requires:
  - frontend/src/services/api.js (axios + sonner interceptor)
  - frontend/src/components/TripMap.jsx (stops + onStopClick props)
  - frontend/src/components/TripCoverPhoto.jsx
  - backend POST /api/trips/:tripId/share (from 04-02)
  - backend GET /api/trips/shared/:token (from 04-02)
provides:
  - Public read-only trip view at /trips/shared/:token
  - Share button in TripDetail that copies signed link to clipboard
  - Friendly "Link expired or invalid" UI for stale tokens
affects:
  - frontend/src/services/api.js (401 interceptor now skips redirect for /api/trips/shared/*)
  - frontend/src/pages/TripDetail.jsx (legacy local toast state replaced by sonner)
tech-stack:
  added: []
  patterns:
    - Public React Router route outside ProtectedRoute
    - URL-aware axios interceptor (per-endpoint 401 handling)
    - navigator.clipboard.writeText + sonner success toast for share UX
key-files:
  created:
    - frontend/src/pages/SharedTrip.jsx
  modified:
    - frontend/src/App.jsx
    - frontend/src/pages/TripDetail.jsx
    - frontend/src/services/api.js
decisions:
  - Map renders markers only in shared view (no route polyline) — route endpoint
    is auth-protected and exposing it publicly is out of scope for v1
  - Cover photo shown if present, but TripCoverPhoto is reused as-is (no readonly
    prop) since it has no edit affordances anyway
  - 7-day signed JWT link copy includes expiry note in success toast
  - Share button placed in back-nav bar (right side) opposite "Back to trips" — keeps
    primary CTA real-estate (header) free for the existing layout
metrics:
  duration_minutes: 5
  tasks_completed: 2
  files_changed: 4
  files_created: 1
  completed_date: 2026-04-06
requirements:
  - TRIP-05
---

# Phase 4 Plan 4: Trip Sharing Frontend Summary

Public read-only trip view at `/trips/shared/:token` plus a Share button in TripDetail that calls the backend share API and copies the signed link to clipboard, completing TRIP-05 end-to-end.

## What Was Built

### Task 1 — SharedTrip page (commit ae2eef7)

- **frontend/src/pages/SharedTrip.jsx** (new): standalone page outside the auth shell. On mount fetches `GET /api/trips/shared/:token` and renders one of four states:
  - `loading` — spinner
  - `loaded` — header with trip name + "Plan your trip" CTA → /signup, optional cover photo, split panel with read-only stop list (no edit/delete/drag controls) and `<TripMap>` showing markers
  - `expired` — 401 from backend → friendly map-emoji card with "Link expired or invalid" headline + "Log in to view your trips" button
  - `error` — generic failure with reload button
- **StopReadOnly** local sub-component renders address, optional description, and date range without any mutation buttons.
- Map intentionally omits the route polyline: the `/api/trips/:id/route` endpoint is auth-protected and exposing routing publicly is out of scope for v1.

### api.js interceptor fix (commit ae2eef7, Rule 3 deviation)

- **frontend/src/services/api.js**: the global 401 handler previously redirected every 401 to `/login` and showed a "Session expired" toast. That made the SharedTrip "expired" branch unreachable — visitors with a stale share link would be bounced to a login page they don't need.
- Added a URL check: when `error.config.url` includes `/api/trips/shared/`, the 401 path is silent (no toast, no redirect). Promise still rejects so `SharedTrip.jsx` can render its own expired UI.

### Task 2 — Wire route + share button (commit 2a6fed4)

- **frontend/src/App.jsx**: imported `SharedTrip` and registered `<Route path="/trips/shared/:token" element={<SharedTrip />} />` placed **before** the protected `/trips/:tripId` route. The literal `shared` segment matches before the dynamic `:tripId`, and the new route deliberately has no `ProtectedRoute` wrapper.
- **frontend/src/pages/TripDetail.jsx**:
  - Added `import { toast } from 'sonner'` and `import api from '../services/api'`.
  - New `handleShare` async function: `setIsSharing(true)`, `api.post('/api/trips/:tripId/share')`, `navigator.clipboard.writeText(res.data.shareUrl)`, success toast `"Share link copied to clipboard! Link expires in 7 days."`. Errors fall through to the api.js interceptor (already toasts).
  - New Share button rendered in the back-nav bar next to "Back to trips". 44px min touch target, share-icon SVG, disabled while in flight or before trip loads, `aria-label="Share trip"`.
  - Removed legacy `const [toast, setToast] = useState(null)` local state, the `showToast` helper, and the inline toast JSX block. All four `showToast(...)` callsites now call sonner's `toast.error(...)` directly (delete/add/edit/reorder failure paths).

## Tasks & Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | SharedTrip read-only page | ae2eef7 | frontend/src/pages/SharedTrip.jsx, frontend/src/services/api.js |
| 2 | Wire route + TripDetail share button | 2a6fed4 | frontend/src/App.jsx, frontend/src/pages/TripDetail.jsx |

## Acceptance Criteria

- [x] frontend/src/pages/SharedTrip.jsx exists with loading/loaded/expired/error states
- [x] SharedTrip contains `api.get(\`/api/trips/shared/${token}\`)`
- [x] SharedTrip renders `<TripMap stops={stops} routeGeometry={null} />`
- [x] SharedTrip "expired" branch shows "Link expired or invalid"
- [x] SharedTrip has no edit/delete/drag controls
- [x] SharedTrip CTA `Link to="/signup"` present
- [x] App.jsx imports SharedTrip and registers `/trips/shared/:token` outside ProtectedRoute
- [x] TripDetail has `handleShare` calling `api.post('/api/trips/:tripId/share')`
- [x] TripDetail uses `navigator.clipboard.writeText`
- [x] TripDetail uses `toast.success` from sonner
- [x] TripDetail no longer has `const [toast, setToast] = useState`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] api.js 401 interceptor hijacked the SharedTrip expired flow**
- **Found during:** Task 1 (writing SharedTrip)
- **Issue:** After plan 04-03, `frontend/src/services/api.js` installed a global axios response interceptor that, on any 401, calls `toast.error('Session expired...')` and `window.location.href = '/login'`. The shared-trip backend (from 04-02) returns 401 for invalid/expired tokens. With the existing interceptor, every visitor with a stale share link would be redirected to /login and shown a misleading "session expired" toast — they have no session and the SharedTrip "expired" UI would never render.
- **Fix:** Added a URL check in the interceptor. When `error.config.url` includes `/api/trips/shared/`, the 401 branch silently rejects so the SharedTrip page can show its own friendly "Link expired or invalid" card. All other 401s preserve the original session-expired behavior.
- **Files modified:** frontend/src/services/api.js
- **Commit:** ae2eef7

The plan flagged the pattern (`if (err.response?.status === 401) setStatus('expired')`) but did not anticipate that the interceptor would intercept first. Without this fix, plan acceptance criterion "expired token shows 'Link expired or invalid' message" would be false in production.

## Known Stubs

None. SharedTrip wires real backend data from `/api/trips/shared/:token` and displays real stop coordinates on the map. The deliberate omission of the route polyline is documented as a v1 scope decision (not a stub) — exposing routing publicly requires a new public endpoint and is tracked implicitly via the comment in SharedTrip.jsx.

## Self-Check: PASSED

- FOUND: frontend/src/pages/SharedTrip.jsx
- FOUND: frontend/src/App.jsx (modified — SharedTrip import + public route)
- FOUND: frontend/src/pages/TripDetail.jsx (modified — handleShare + sonner)
- FOUND: frontend/src/services/api.js (modified — public-shared 401 bypass)
- FOUND commit: ae2eef7
- FOUND commit: 2a6fed4
