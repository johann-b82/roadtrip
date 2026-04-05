# Phase 1: Authentication & User Setup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 01-authentication-user-setup
**Areas discussed:** Session strategy, Password reset flow, Home location input, Registration experience

---

## Session Strategy

### JWT Storage

| Option | Description | Selected |
|--------|-------------|----------|
| httpOnly cookies | Server sets cookie automatically. Immune to XSS. Requires CSRF protection. | ✓ |
| localStorage + axios interceptor | Simpler to implement. Vulnerable to XSS but acceptable for MVP. | |
| You decide | Let Claude pick | |

**User's choice:** httpOnly cookies
**Notes:** Industry standard approach selected for security.

### Session Persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Refresh token rotation | Short-lived access token (15min) + long-lived refresh token (7 days). Rotates on each use. | ✓ |
| Single long-lived JWT | One token, long expiry (7-30 days). Simpler but no revocation. | |
| You decide | Let Claude pick | |

**User's choice:** Refresh token rotation
**Notes:** None

### Session Expiry UX

| Option | Description | Selected |
|--------|-------------|----------|
| Silent refresh | Automatically refresh in background. User never sees interruption. | ✓ |
| Redirect to login with message | Show 'Session expired' and redirect. | |
| You decide | Let Claude pick | |

**User's choice:** Silent refresh
**Notes:** None

### Logout Invalidation

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side invalidation | Store refresh tokens in DB, delete on logout. Prevents reuse. | ✓ |
| Client-side only | Just clear cookies. Old tokens remain valid until expiry. | |
| You decide | Let Claude pick | |

**User's choice:** Server-side invalidation
**Notes:** None

---

## Password Reset Flow

### Email Service

| Option | Description | Selected |
|--------|-------------|----------|
| Resend | Modern API, 100 emails/day free tier, simple Node.js SDK. | ✓ |
| Nodemailer + Gmail SMTP | No third-party service. Uses Gmail as SMTP relay. | |
| SendGrid | Industry standard, free tier (100 emails/day). More complex setup. | |
| You decide | Let Claude pick | |

**User's choice:** Resend
**Notes:** None

### Token Expiry

| Option | Description | Selected |
|--------|-------------|----------|
| 1 hour | Standard. Long enough for email, short enough to limit exposure. | ✓ |
| 15 minutes | More secure but tight. | |
| 24 hours | Very generous. Lower security. | |
| You decide | Let Claude pick | |

**User's choice:** 1 hour
**Notes:** None

### Post-Reset Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-login and redirect to app | Less friction, user just proved identity. | ✓ |
| Redirect to login page with success message | Explicit flow, user manually logs in. | |
| You decide | Let Claude pick | |

**User's choice:** Auto-login and redirect to app
**Notes:** None

---

## Home Location Input

### Input Method

| Option | Description | Selected |
|--------|-------------|----------|
| Address search with map preview | Nominatim autocomplete + small map to confirm. Reuses Phase 2 pattern. | ✓ |
| Map pin picker | Click/drag pin on full map. Visual but complex. | |
| Address text field only | Simple text input. No visual confirmation. | |
| You decide | Let Claude pick | |

**User's choice:** Address search with map preview
**Notes:** None

### Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Part of onboarding after signup | Prompted right after registration. | ✓ |
| Optional in profile settings | Set whenever from settings. | |
| You decide | Let Claude pick | |

**User's choice:** Part of onboarding after signup
**Notes:** None

### Required vs Skippable

| Option | Description | Selected |
|--------|-------------|----------|
| Skippable with gentle nudge | Can skip, reminder when creating first trip. | ✓ |
| Required before using the app | Must set before proceeding. | |
| You decide | Let Claude pick | |

**User's choice:** Skippable with gentle nudge
**Notes:** None

---

## Registration Experience

### Signup Form

| Option | Description | Selected |
|--------|-------------|----------|
| Single page: email + password | One form with email, password, confirm password. Minimal friction. | ✓ |
| Multi-step: account then profile | Step 1: credentials. Step 2: name + home. More guided. | |
| You decide | Let Claude pick | |

**User's choice:** Single page
**Notes:** None

### Email Verification

| Option | Description | Selected |
|--------|-------------|----------|
| No verification for v1 | Immediate access. Email only for password reset. | ✓ |
| Verification required | Must click link before accessing app. | |
| Verification optional (grace period) | Use app immediately, verify within 7 days. | |
| You decide | Let Claude pick | |

**User's choice:** No verification for v1
**Notes:** None

### Post-Signup Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-login + home location prompt | Immediately logged in, onboarding screen for home (skippable). | ✓ |
| Auto-login + dashboard | Logged in, land on empty dashboard. | |
| You decide | Let Claude pick | |

**User's choice:** Auto-login + home location prompt
**Notes:** None

### Auth Page Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Centered card with travel imagery | Clean card on travel photo/gradient background. Professional. | ✓ |
| Split layout (form + hero image) | Left: form. Right: large hero image. | |
| Minimal white page | Just the form, no imagery. | |
| You decide | Let Claude pick | |

**User's choice:** Centered card with travel imagery
**Notes:** None

---

## Claude's Discretion

- CSRF protection approach
- Password strength requirements
- Rate limiting on auth endpoints
- Database schema design
- Error message wording and validation UX

## Deferred Ideas

None — discussion stayed within phase scope
