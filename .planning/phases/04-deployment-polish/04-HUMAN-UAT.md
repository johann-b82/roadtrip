---
status: partial
phase: 04-deployment-polish
source: [04-VERIFICATION.md]
started: 2026-04-06T11:00:00Z
updated: 2026-04-06T11:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. `docker compose up` end-to-end bring-up
expected: All 5 containers (postgres, osrm, backend, frontend, nginx) reach healthy state; app loads at http://localhost; /api/trips returns 200 for an authenticated user
result: [pending]

### 2. Mobile viewport UX on real device / Chrome DevTools 375px
expected: Fullscreen map toggle visible & tappable (≥44px); POI panel opens as bottom sheet with snap at ~45%; no horizontal scroll; touch targets ≥44px
result: [pending]

### 3. Public shared trip view in incognito window
expected: Unauthenticated visitor is NOT redirected to /login; page shows trip name, stop count, stop addresses, and map markers for each stop
result: [pending]

### 4. Tampered/expired share token
expected: No /login redirect and no "Session expired" toast; SharedTrip's "Link expired or invalid" card renders with map emoji and "Log in to view your trips" CTA
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
