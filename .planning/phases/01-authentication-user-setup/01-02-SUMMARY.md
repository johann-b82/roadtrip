---
phase: 01-authentication-user-setup
plan: 02
subsystem: auth
tags: [jwt, bcrypt, passport, express, postgresql, cookies, rate-limiting, resend]

# Dependency graph
requires:
  - phase: 01-01
    provides: Docker Compose scaffold, PostgreSQL schema (users, refresh_tokens, password_reset_tokens), Express 5 backend skeleton

provides:
  - JWT access+refresh token issuance with httpOnly cookie storage
  - bcrypt password hashing (12 rounds) and verification
  - SHA-256 token hashing for DB storage
  - Passport.js JWT strategy reading from httpOnly cookies
  - requireAuth middleware for protected routes
  - User model: findByEmail, findById, create, updatePassword, updateHomeLocation
  - Six auth REST endpoints: signup, login, logout, refresh, forgot-password, reset-password
  - Server-side refresh token rotation with PostgreSQL storage
  - Single-use hashed password reset tokens with 1-hour expiry
  - Resend email integration for password reset
  - Rate limiting on all auth endpoints (express-rate-limit)
  - Anti-enumeration generic error messages

affects: [01-03, 01-04, 01-05, all frontend auth flows]

# Tech tracking
tech-stack:
  added:
    - bcrypt 6.0.0 (password hashing, 12 rounds)
    - jsonwebtoken 9.0.3 (JWT sign/verify)
    - passport 0.7.x + passport-jwt 4.0.1 (JWT strategy from cookies)
    - express-rate-limit 7.5.0 (brute-force protection)
    - resend 6.10.0 (transactional email for password reset)
  patterns:
    - httpOnly + secure + sameSite=strict cookies for JWT storage (never localStorage)
    - Refresh token rotation: delete old, issue new on every /auth/refresh call
    - SHA-256 hashing before DB storage of refresh and reset tokens
    - Anti-enumeration: identical error messages for wrong email vs wrong password
    - Single-use reset tokens: used=TRUE flag prevents replay attacks
    - D-07: auto-login after password reset (issue tokens immediately)
    - D-12: no email verification required for signup

key-files:
  created:
    - backend/src/auth/utils.js
    - backend/src/auth/middleware.js
    - backend/src/auth/strategies/jwt.js
    - backend/src/auth/routes.js
    - backend/src/users/model.js
    - backend/tests/auth.utils.test.js
    - backend/tests/users.model.test.js
  modified:
    - backend/src/index.js (added passport.initialize(), mounted /auth router)

key-decisions:
  - "Shared COOKIE_OPTS object with httpOnly/secure/sameSite spread into ACCESS and REFRESH variants (DRY pattern)"
  - "Email errors always return same message to prevent account enumeration (forgot-password, login)"
  - "storeRefreshToken helper centralizes DB insertion for refresh tokens across signup/login/refresh/reset-password"
  - "Resend email errors are caught and logged but not propagated to client (maintains anti-enumeration)"

patterns-established:
  - "Pattern: auth utils in utils.js, DB queries in model.js, HTTP handlers in routes.js"
  - "Pattern: requireAuth middleware for all protected endpoints"
  - "Pattern: rate limiters defined at top of routes.js and applied per-route"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 3min
completed: 2026-04-05
---

# Phase 01 Plan 02: Auth Endpoints Summary

**JWT auth with httpOnly cookie rotation, bcrypt hashing, rate limiting, and Resend password reset covering all 6 /auth endpoints.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-05T14:06:15Z
- **Completed:** 2026-04-05T14:09:45Z
- **Tasks:** 2 completed
- **Files modified:** 8

## Accomplishments

### Task 1: Auth utilities and user model (TDD)

Implemented all foundational auth helpers:

- `backend/src/auth/utils.js`: `hashPassword` (bcrypt 12 rounds), `verifyPassword`, `issueTokens` (15m access / 7d refresh, payload includes `sub` and `type` claims), `hashToken` (SHA-256 hex)
- `backend/src/users/model.js`: `findByEmail`, `findById`, `create`, `updatePassword`, `updateHomeLocation` — all parameterized queries via `db/connection.query`
- `backend/src/auth/strategies/jwt.js`: Passport JWT strategy with custom `cookieExtractor` reading from `req.cookies.accessToken`
- `backend/src/auth/middleware.js`: `requireAuth` using `passport.authenticate('jwt', { session: false })`

19 unit tests written (TDD RED→GREEN), all passing.

### Task 2: Auth routes (signup, login, logout, refresh, forgot-password, reset-password)

All 6 endpoints implemented in `backend/src/auth/routes.js`:

| Endpoint | Rate Limit | Key Security |
|---|---|---|
| POST /auth/signup | 10/15min | email validation, duplicate check (409), bcrypt hash |
| POST /auth/login | 5/15min | anti-enumeration, bcrypt verify |
| POST /auth/logout | none | requireAuth, DB token deletion |
| POST /auth/refresh | none | JWT verify, token rotation |
| POST /auth/forgot-password | 3/hour | anti-enumeration, hashed token, Resend email |
| POST /auth/reset-password | 5/hour | used=FALSE check, D-07 auto-login |

`backend/src/index.js` updated: `passport.initialize()` added, `/auth` router mounted.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

One minor structural deviation worth noting:
- **COOKIE_OPTS pattern:** Used a single shared `COOKIE_OPTS` object spread into `ACCESS_COOKIE_OPTS` and `REFRESH_COOKIE_OPTS` instead of repeating cookie options inline. This is a DRY improvement over the plan's example. Security properties (`httpOnly: true`, `sameSite: 'strict'`, `secure: production-only`) are identical.

## Known Stubs

None — all endpoints have complete implementations. Resend email is wired to `process.env.RESEND_API_KEY` and `process.env.FRONTEND_URL` which must be set in environment config.

## Self-Check: PASSED

All 8 files created/modified confirmed present on disk. All 3 task commits verified in git log:
- `a87fb4e` test(01-02): add failing tests for auth utils and user model
- `4116b4a` feat(01-02): implement auth utilities and user model
- `2b35dc7` feat(01-02): implement all 6 auth endpoints with security requirements
