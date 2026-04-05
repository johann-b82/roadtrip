# Phase 1: Authentication & User Setup - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can securely create accounts with email/password, log in persistently across browser sessions, reset forgotten passwords via email, log out from any page, and define/update a home location as their default trip starting point. Google OAuth is deferred to v2.

</domain>

<decisions>
## Implementation Decisions

### Session Strategy
- **D-01:** JWT tokens stored in httpOnly cookies (not localStorage). Server sets cookies automatically. Requires CSRF protection.
- **D-02:** Refresh token rotation — short-lived access token (15min) + long-lived refresh token (7 days). Refresh token rotates on each use.
- **D-03:** Silent refresh in background — user never sees interruption unless refresh token also expired. If refresh token expired, redirect to login with message.
- **D-04:** Server-side refresh token invalidation on logout — store refresh tokens in PostgreSQL, delete on logout. Prevents reuse of stolen tokens.

### Password Reset Flow
- **D-05:** Email service: Resend (modern API, 100 emails/day free tier, simple Node.js SDK).
- **D-06:** Password reset token expiry: 1 hour.
- **D-07:** After successful password reset: auto-login and redirect to app (user just proved identity via email).

### Home Location Input
- **D-08:** Address search with map preview — type address with Nominatim autocomplete, select from results, see pin on a small map to confirm. Reuses Nominatim pattern needed in Phase 2.
- **D-09:** Home location setup prompted during onboarding right after signup.
- **D-10:** Home location is skippable with gentle nudge — show reminder when user creates first trip without home set.

### Registration Experience
- **D-11:** Single-page signup form: email, password, confirm password. Name optional or collected later.
- **D-12:** No email verification for v1 — user signs up and is immediately in. Email only used for password reset.
- **D-13:** Post-signup flow: auto-login, redirect to onboarding screen prompting home location (skippable).
- **D-14:** Auth pages: centered card with subtle travel imagery/gradient background. Professional, sets the mood.

### Claude's Discretion
- CSRF protection implementation details (double-submit cookie vs. token pattern)
- Password strength requirements (minimum length, complexity rules)
- Rate limiting on login/signup/reset endpoints
- Database schema design for users, refresh tokens, password reset tokens
- Error message wording and validation UX

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and project docs:

### Project Docs
- `.planning/PROJECT.md` — Core constraints (stack, auth approach, free-tier APIs)
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-04, PROF-01, PROF-02 acceptance criteria
- `.planning/ROADMAP.md` — Phase 1 success criteria (6 items)
- `CLAUDE.md` — Technology stack with exact versions (Passport.js, bcrypt 6.0, jsonwebtoken 9.x, Express 5.2.1, PostgreSQL 18.3, React 19.2.1)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None — Phase 1 establishes the foundational patterns for the project

### Integration Points
- This phase creates the auth foundation that Phase 2+ depends on (authenticated user context)
- Home location Nominatim autocomplete pattern will be reused for stop address input in Phase 2
- Database schema for users table becomes the foundation for trips/stops foreign keys

</code_context>

<specifics>
## Specific Ideas

- Auth pages should feel like a travel app (travel imagery, not generic SaaS)
- Onboarding flow after signup: login -> home location prompt (skippable) -> dashboard
- Silent refresh should be seamless — user should never notice token rotation happening

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-authentication-user-setup*
*Context gathered: 2026-04-05*
