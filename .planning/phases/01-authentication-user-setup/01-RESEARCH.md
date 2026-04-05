# Phase 1: Authentication & User Setup - Research

**Researched:** 2026-04-05
**Domain:** JWT authentication, password management, email delivery, address geocoding
**Confidence:** HIGH

## Summary

Phase 1 establishes the authentication foundation for RoadTrip: secure user registration, persistent login with refresh token rotation, password reset via email, and home location persistence. The stack uses Passport.js with JWT in httpOnly cookies (protected with CSRF), bcrypt password hashing, Resend for transactional email, and Nominatim for address autocomplete.

All technology decisions are locked (CONTEXT.md). Research validates that the chosen stack is production-ready, follows 2026 security best practices, and pairs well with the React 19 + Express 5 + PostgreSQL 18 foundation. Key risks are low: refresh token validation, CSRF implementation details, and database schema design are well-understood patterns.

**Primary recommendation:** Implement JWT + refresh token rotation with server-side token storage in PostgreSQL; use httpOnly cookies with CSRF double-submit pattern; hash passwords with bcrypt at 12 rounds; send password reset emails via Resend with 1-hour token expiry and single-use enforcement.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

| Decision | Rationale |
|----------|-----------|
| **JWT in httpOnly cookies** (D-01) | Protects against XSS; requires CSRF protection |
| **Refresh token rotation** (D-02, D-03) | 15-min access token + 7-day refresh token; auto-refresh in background |
| **Server-side token invalidation** (D-04) | Refresh tokens stored in PostgreSQL; deleted on logout |
| **Resend for email** (D-05) | Modern API, 100 emails/day free tier, simple Node.js SDK |
| **Password reset: 1-hour expiry** (D-06) | Balances security and UX |
| **Auto-login after reset** (D-07) | User proved identity via email; skip re-entry |
| **Address search with map preview** (D-08) | Nominatim autocomplete + small map pin confirmation |
| **Home location optional with nudge** (D-09, D-10) | Prompted post-signup but skippable; reminder on trip creation |
| **Single-page signup form** (D-11) | Email, password, confirm password; name optional |
| **No email verification for v1** (D-12) | User signs up and immediately logs in |
| **Post-signup flow: auto-login + onboarding** (D-13) | Redirect to home location setup (skippable) |
| **Travel-themed auth UI** (D-14) | Centered card with subtle imagery/gradient |

### Claude's Discretion (Research to Follow)

- CSRF protection implementation (double-submit cookie vs. token pattern)
- Password strength requirements (minimum length, complexity rules)
- Rate limiting on login/signup/reset endpoints
- Database schema design for users, refresh tokens, password reset tokens
- Error message wording and validation UX

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign up with email and password | bcrypt 6.0 hashing, Passport.js registration flow, PostgreSQL users table |
| AUTH-02 | User can log in and stay logged in across browser sessions | JWT refresh token rotation, httpOnly cookies, server-side token storage |
| AUTH-03 | User can log out from any page | Refresh token deletion from database, token blacklist on logout |
| AUTH-04 | User can reset password via email link | Resend email service, hashed reset tokens, 1-hour expiry, single-use enforcement |
| PROF-01 | User can set a home location as default trip starting point | Nominatim address autocomplete, React address input component, PostgreSQL user profile |
| PROF-02 | User can update their home location | Same as PROF-01; re-query and update user.home_location |

---

## Standard Stack

### Core Authentication Libraries

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Passport.js** | 0.7.x | Authentication middleware | Industry standard (500+ strategies), stateless-friendly, works cleanly with Express. Used by major projects. |
| **passport-jwt** | 4.0.1 | JWT strategy for Passport | Handles Authorization header extraction and token verification. Last updated 3 years ago but stable and widely used. |
| **jsonwebtoken** | 9.0.3 | JWT creation/verification | Industry standard. Use HS256 or RS256 algorithms. Include `exp`, `iat`, `sub` claims for security. |
| **bcrypt** | 6.0.0 | Password hashing | Only secure option for password hashing. v6.0.0+ (released April 2025) adds ESM support and libc-specific bindings. Use async API to avoid event loop blocking. |
| **Express.js** | 5.2.1 | REST API backend | Latest LTS (Dec 2024). Improved error handling; rejected promises caught by router. |
| **pg** | 8.20.0 | PostgreSQL client | Pure JavaScript, well-maintained (8.2M+ weekly downloads). Offers callback and promise-based APIs. Built-in connection pooling. |

### Email & Geocoding

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Resend** | 6.10.0 | Transactional email | Modern API (2023+), free tier 100 emails/day (adequate for MVP signup/reset), simple Node.js SDK, production-ready |
| **Nominatim** | OSM API | Address geocoding & autocomplete | Part of OpenStreetMap ecosystem (free, no key required). Rate limited to 1 req/sec but sufficient for address autocomplete with caching. |
| **axios** | 1.7.x | HTTP client (Node.js) | Promise-based, request cancellation, auto-serialization. Use for Nominatim API calls. |

### Frontend State & Forms (from CLAUDE.md)

| Library | Version | Purpose | Why Relevant |
|---------|---------|---------|--------------|
| **React** | 19.2.1 | Frontend framework | Latest stable. useEffect, useState for auth state. |
| **React Hook Form** | 7.x | Form state (signup/login/reset) | 7M+ weekly downloads, 12.12KB gzipped, zero dependencies. Handles complex multi-field forms efficiently. |
| **React Router** | 7.x | Client-side routing | Standard for React SPAs. Handle /login, /signup, /reset, /dashboard. Protected routes via auth context. |
| **Zustand** (optional) | 4.x | Global state (user, auth tokens) | 3KB bundle, minimal boilerplate. Recommended for MVP+ to store: current user, login status, home location. |
| **Tailwind CSS** | 4.x | Styling | Pairs well with React. Utility-first for rapid auth UI (card, form, buttons). |

### Installation

```bash
# Backend dependencies
npm install express@5.2.1 passport@0.7.0 passport-jwt@4.0.1 jsonwebtoken@9.0.3 bcrypt@6.0.0 pg@8.20.0 resend@6.10.0 dotenv@17.4.0 axios@1.7.x

# Backend dev
npm install --save-dev jest@30.3.0 supertest@7.x

# Frontend dependencies
npm install react@19.2.1 react-router@7.x react-hook-form@7.x zustand@4.x tailwind@4.x

# Frontend dev
npm install --save-dev vite@6.x
```

---

## Architecture Patterns

### Recommended Project Structure

**Backend (`src/` or `backend/`):**
```
src/
├── auth/
│   ├── routes.js           # POST /signup, /login, /logout, /refresh, /reset-password
│   ├── strategies/
│   │   ├── jwt.js          # Passport JWT strategy
│   │   └── local.js        # Passport local strategy (optional, for login)
│   ├── middleware.js       # requireAuth, optionalAuth, CSRF middleware
│   └── utils.js            # hashPassword, verifyPassword, generateTokens
├── users/
│   ├── model.js            # User queries (findById, findByEmail, create, update)
│   └── schema.sql          # CREATE TABLE users, refresh_tokens, password_reset_tokens
├── email/
│   ├── service.js          # Resend client wrapper, sendPasswordReset
│   └── templates/
│       └── resetPassword.html   # Email template
├── db/
│   ├── connection.js       # PostgreSQL connection pool
│   └── migrations/         # SQL migration scripts (if using migration tool)
└── index.js                # Express app setup, middleware, routes
```

**Frontend (`src/` with Vite):**
```
src/
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── ResetPassword.jsx
│   └── Onboarding.jsx      # Post-signup home location setup
├── components/
│   ├── AuthForm.jsx        # Reusable signup/login form
│   ├── AddressInput.jsx     # Nominatim autocomplete + map
│   └── ProtectedRoute.jsx   # Redirect if not authenticated
├── hooks/
│   ├── useAuth.js          # Custom hook for auth state, login, logout, signup
│   ├── useAuthRefresh.js   # Silent token refresh on background
│   └── useNominatim.js     # Nominatim address search with debounce
├── store/
│   └── authStore.js        # Zustand store: user, isAuthenticated, homeLocation
├── services/
│   ├── api.js              # axios instance with auth interceptor
│   └── nominatim.js        # Nominatim API wrapper
└── App.jsx
```

### Pattern 1: JWT Access + Refresh Token Rotation

**What:** Two-token system: short-lived access token (15 min) + long-lived refresh token (7 days). Refresh token is single-use; each refresh generates a new pair and invalidates the old refresh token.

**When to use:** This phase. Essential for user experience (silent re-auth) and security (minimal damage if access token stolen).

**Flow:**
1. User logs in → server issues access token (15min) + refresh token (7 days)
2. Access token stored in httpOnly cookie (auto-sent on requests)
3. Refresh token stored in httpOnly cookie + database record
4. Before access token expires: client calls `/auth/refresh` → server validates old refresh token, deletes it from DB, issues new pair
5. On logout: delete refresh token from database → token becomes invalid even if stolen

**Example:**

```javascript
// Backend: routes/auth.js (Express + Passport)
// Source: Passport.js official docs + OWASP JWT best practices

const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET; // 32+ char random string
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET; // Different secret
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// Issue new token pair
function issueTokens(userId) {
  const accessToken = jwt.sign(
    { sub: userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  
  const refreshToken = jwt.sign(
    { sub: userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  
  return { accessToken, refreshToken };
}

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Validate credentials against bcrypt hash in DB
  const user = await db.query(
    'SELECT id, password_hash FROM users WHERE email = $1',
    [email]
  );
  if (!user.rows.length) {
    return res.status(401).json({ error: 'Invalid email/password' });
  }
  
  const isValid = await bcrypt.compare(password, user.rows[0].password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email/password' });
  }
  
  const userId = user.rows[0].id;
  const { accessToken, refreshToken } = issueTokens(userId);
  
  // Store refresh token in DB for revocation
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hashToken(refreshToken), new Date(Date.now() + 7*24*60*60*1000)]
  );
  
  // httpOnly, secure, sameSite cookies
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  res.json({ success: true, userId });
});

// POST /auth/refresh (silent, called by frontend on background)
router.post('/auth/refresh', async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;
  
  if (!oldRefreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }
  
  try {
    const decoded = jwt.verify(oldRefreshToken, JWT_REFRESH_SECRET);
    const userId = decoded.sub;
    
    // Check if token exists in DB (not revoked)
    const result = await db.query(
      'SELECT id FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2',
      [userId, hashToken(oldRefreshToken)]
    );
    
    if (!result.rows.length) {
      return res.status(401).json({ error: 'Token revoked or invalid' });
    }
    
    // Issue new pair and delete old refresh token
    const { accessToken, refreshToken } = issueTokens(userId);
    
    await db.query('DELETE FROM refresh_tokens WHERE id = $1', [result.rows[0].id]);
    
    await db.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [userId, hashToken(refreshToken), new Date(Date.now() + 7*24*60*60*1000)]
    );
    
    // Set new cookies
    res.cookie('accessToken', accessToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15*60*1000 });
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7*24*60*60*1000 });
    
    res.json({ success: true });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
```

```javascript
// Frontend: hooks/useAuthRefresh.js
// Auto-refresh token 30 seconds before expiry

import { useEffect } from 'react';
import axios from 'axios';

export function useAuthRefresh() {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await axios.post('/auth/refresh');
      } catch (err) {
        // Refresh failed (token expired) — redirect to login
        window.location.href = '/login?expired=true';
      }
    }, 14 * 60 * 1000); // 14 minutes (refresh every 14 min, before 15-min expiry)
    
    return () => clearInterval(interval);
  }, []);
}

// App.jsx
import { useAuthRefresh } from './hooks/useAuthRefresh';

export default function App() {
  useAuthRefresh(); // Start background refresh on mount
  return <RouterComponent />;
}
```

### Pattern 2: CSRF Protection with httpOnly Cookies

**What:** Double-submit cookie pattern: server sets a CSRF token in a non-httpOnly cookie (readable by JavaScript). Client must include this token in a custom header (`X-CSRF-TOKEN`) for state-changing requests (POST, PUT, DELETE).

**Why:** httpOnly cookies prevent XSS from reading the JWT, but don't prevent CSRF attacks (attacker tricks browser into making a request). CSRF token header adds a second layer: attacker cannot read the token from a non-httpOnly cookie on a different domain.

**Example:**

```javascript
// Backend: middleware/csrf.js
// Use csurf library or custom implementation

const csrf = require('csurf');
const express = require('express');

// csurf middleware — generates and validates CSRF tokens
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: false,        // Readable by JavaScript (unlike JWT)
    secure: true,           // HTTPS only in production
    sameSite: 'strict'
  }
});

// Apply to routes
app.use(csrfProtection);

// Middleware to inject CSRF token in response
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Protect state-changing routes
app.post('/auth/login', csrfProtection, (req, res) => {
  // csurf middleware validates X-CSRF-TOKEN header automatically
  // ... login logic
});

module.exports = csrfProtection;
```

```javascript
// Frontend: services/api.js
// Axios interceptor to inject CSRF token

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true // Include cookies
});

// Inject CSRF token into every request
api.interceptors.request.use((config) => {
  const token = document.querySelector('meta[name="csrf-token"]')?.content;
  if (token) {
    config.headers['X-CSRF-TOKEN'] = token;
  }
  return config;
});

export default api;
```

### Pattern 3: Password Reset Flow

**What:** User requests reset → server sends email with single-use token (hashed in DB) → user clicks link, enters new password → server validates token (1-hour expiry, single-use), updates password, auto-logs in.

**Key security:**
- Token is hashed in database (not stored plaintext)
- Token expires after 1 hour
- Token is deleted after use (single-use)
- New password hashed with bcrypt 12 rounds
- User auto-logged in after reset (no need to re-enter credentials)

**Example:**

```javascript
// Backend: routes/auth.js (password reset)

// POST /auth/forgot-password
router.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  
  // Generic response to prevent account enumeration
  const responseMsg = 'If an account with that email exists, a reset link will be sent.';
  
  const user = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (!user.rows.length) {
    return res.json({ message: responseMsg }); // Generic response, no error leak
  }
  
  // Generate cryptographically secure token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + 1*60*60*1000); // 1 hour
  
  // Store hashed token in DB
  await db.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.rows[0].id, resetTokenHash, expiresAt]
  );
  
  // Send email with reset link (contains plain token, not hash)
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  await resend.emails.send({
    from: 'noreply@roadtrip.app',
    to: email,
    subject: 'Reset Your RoadTrip Password',
    html: `<a href="${resetLink}">Reset Password</a>`
  });
  
  res.json({ message: responseMsg });
});

// POST /auth/reset-password
router.post('/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Find token and validate expiry + single-use
  const result = await db.query(
    'SELECT user_id FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW() AND used = FALSE',
    [tokenHash]
  );
  
  if (!result.rows.length) {
    return res.status(400).json({ error: 'Invalid or expired reset link' });
  }
  
  const userId = result.rows[0].user_id;
  
  // Hash new password with bcrypt
  const passwordHash = await bcrypt.hash(newPassword, 12); // 12 salt rounds
  
  // Update password and mark token as used
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
  await db.query('UPDATE password_reset_tokens SET used = TRUE WHERE token_hash = $1', [tokenHash]);
  
  // Auto-login: issue new tokens
  const { accessToken, refreshToken } = issueTokens(userId);
  await db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hashToken(refreshToken), new Date(Date.now() + 7*24*60*60*1000)]
  );
  
  res.cookie('accessToken', accessToken, { httpOnly: true, secure: true, sameSite: 'strict' });
  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict' });
  
  res.json({ success: true, message: 'Password reset. You are now logged in.' });
});
```

### Pattern 4: Nominatim Address Autocomplete with Caching

**What:** User types address → debounced Nominatim API calls → results cached locally for 24 hours → user selects result → small map preview confirms pin location.

**Caching strategy:** Client-side LRU cache (24-hour TTL) to respect 1 req/sec rate limit and improve UX.

**Example:**

```javascript
// Frontend: hooks/useNominatim.js

import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

const NOMINATIM_CACHE = new Map(); // Simple in-memory cache
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function useNominatim() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);
  
  const search = useCallback((query) => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }
    
    // Check cache
    const cached = NOMINATIM_CACHE.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setResults(cached.results);
      return;
    }
    
    // Debounce API call (wait 500ms after user stops typing)
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        // Call Nominatim via backend to avoid CORS and respect rate limit
        const response = await axios.get('/api/geocoding/search', { params: { q: query } });
        
        // Cache result
        NOMINATIM_CACHE.set(query, {
          results: response.data,
          timestamp: Date.now()
        });
        
        setResults(response.data);
      } catch (err) {
        console.error('Nominatim search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  }, []);
  
  return { results, loading, search };
}

// Frontend: components/AddressInput.jsx

import { useState } from 'react';
import { useNominatim } from '../hooks/useNominatim';
import MapPreview from './MapPreview';

export default function AddressInput({ onSelect }) {
  const [query, setQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const { results, loading, search } = useNominatim();
  
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    search(value);
  };
  
  const handleSelect = (result) => {
    setSelectedResult(result);
    setQuery(result.display_name);
    setResults([]);
    onSelect({
      address: result.display_name,
      lat: result.lat,
      lon: result.lon
    });
  };
  
  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Enter address..."
        className="w-full border rounded p-2"
      />
      
      {loading && <p>Searching...</p>}
      
      {results.length > 0 && (
        <ul className="border rounded mt-1">
          {results.map((result) => (
            <li
              key={result.osm_id}
              onClick={() => handleSelect(result)}
              className="p-2 cursor-pointer hover:bg-gray-100"
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
      
      {selectedResult && (
        <MapPreview
          lat={selectedResult.lat}
          lon={selectedResult.lon}
          address={selectedResult.display_name}
        />
      )}
    </div>
  );
}
```

```javascript
// Backend: routes/geocoding.js (Nominatim wrapper)

const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET /api/geocoding/search?q=address
router.get('/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.length < 3) {
    return res.status(400).json({ error: 'Query too short' });
  }
  
  try {
    // Call Nominatim with user-agent (required by OSM usage policy)
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q,
        format: 'json',
        limit: 5
      },
      headers: {
        'User-Agent': 'RoadTrip/1.0 (+https://roadtrip.app)'
      }
    });
    
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Geocoding service error' });
  }
});

module.exports = router;
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom crypto, MD5, SHA1, single-hash | **bcrypt** (npm) | bcrypt automatically generates salt, handles timing attacks, adapts to faster hardware over time |
| JWT validation | Parse token manually, skip verification | **jsonwebtoken** (npm) + **passport-jwt** | Validates signature, expiration, algorithm; prevents token tampering |
| CSRF protection | Custom token generation | **csurf** (npm) or framework built-in | Double-submit pattern, secure token generation, integrates with Express session/cookie handling |
| Email sending | SMTP client, hardcoded templates | **Resend** (SDK) | Manages rate limiting, retry logic, bounce handling; modern API |
| Address geocoding | Custom string matching, hardcoded list | **Nominatim** (API) + client-side cache | Handles address normalization, fuzzy matching, coordinates; distributed OSM data |
| Token refresh | Manual token expiry checking | **jsonwebtoken** `verify()` + database check | Checks expiration, signature, and revocation in one place |
| Form validation | Custom regex, manual error state | **React Hook Form** + validation library | Handles async validation, multi-field dependencies, re-render optimization |

**Key insight:** Authentication is a domain where subtle mistakes lead to security breaches. Use battle-tested libraries for cryptography (bcrypt), token management (JWT), email delivery (Resend), and CSRF protection (csurf). Custom implementations introduce vulnerabilities.

---

## Common Pitfalls

### Pitfall 1: Storing Sensitive Data in JWT Payload

**What goes wrong:** Developer puts passwords, API keys, or PII in JWT claims. Since JWT is only encoded (not encrypted), anyone can decode it at jwt.io and read the payload.

**Why it happens:** Misconception that JWT payload is private. Only the signature is secured; the payload is base64-encoded, not encrypted.

**How to avoid:** Store only public, non-sensitive data in JWT: `{ sub: userId, type: 'access', iat, exp }`. Fetch user details from database on each request if needed.

**Warning signs:** Passwords, credit card numbers, or API keys visible in decoded JWT.

---

### Pitfall 2: localStorage Instead of httpOnly Cookies

**What goes wrong:** Storing JWT in localStorage, then stealing via XSS attack. 92% of JWT leaks originate from frontend storage mistakes.

**Why it happens:** localStorage is easier to implement (no CSRF needed), but XSS can read it with `localStorage.getItem('token')`.

**How to avoid:** Store JWT in httpOnly cookie (JavaScript cannot access it). Pair with CSRF double-submit for POST/PUT/DELETE requests.

**Warning signs:** `localStorage.setItem('token', jwt)` in client code; no CSRF token validation on backend.

---

### Pitfall 3: No Token Revocation on Logout

**What goes wrong:** After user logs out, JWT remains valid until natural expiration. Stolen token can be used until expiry.

**Why it happens:** JWT is stateless by design; server doesn't track issued tokens by default.

**How to avoid:** Store refresh tokens in PostgreSQL. On logout: delete user's refresh token from DB. For access token revocation (optional but recommended): maintain a blacklist table with revoked token IDs and expiration; check blacklist on each request.

**Warning signs:** Logout just clears client cookie but token still valid on API if request includes cookie.

---

### Pitfall 4: Weak or Guessable Password Reset Tokens

**What goes wrong:** Reset token is short (e.g., 4-digit code) or not cryptographically random. Attacker guesses or brute-forces token.

**Why it happens:** Desire for simple UX (short tokens) or using weak randomness (`Math.random()`).

**How to avoid:** Generate token with cryptographically secure randomness: `crypto.randomBytes(32).toString('hex')` (32 bytes = 256-bit entropy). Hash token before storing in DB. Expire after 1 hour.

**Warning signs:** Reset token < 10 characters; `Math.random()` or sequential IDs; token stored plaintext in DB.

---

### Pitfall 5: Rate Limiting Absence on Auth Endpoints

**What goes wrong:** Attacker brute-forces login, password reset, or signup endpoints without throttling.

**Why it happens:** Developer focuses on happy path; doesn't add rate limiting.

**How to avoid:** Use `express-rate-limit` (npm) or similar. Limit `/login` to 5 attempts per 15 minutes per IP. Limit `/forgot-password` to 3 requests per hour per email. Return 429 (Too Many Requests) on exceeded limits.

**Warning signs:** No rate limiting middleware on auth routes; logs show repeated login attempts from same IP.

---

### Pitfall 6: Account Enumeration via Password Reset

**What goes wrong:** Backend returns "Email not found" on `/forgot-password`, revealing which emails are registered. Attacker enumerates valid accounts.

**Why it happens:** Obvious error message design.

**How to avoid:** Always return generic message: "If an account with that email exists, a reset link will be sent." Send email only if account exists, but don't leak that in response.

**Warning signs:** Different HTTP status codes or error messages for existing vs. non-existing emails.

---

### Pitfall 7: No CSRF Protection with httpOnly Cookies

**What goes wrong:** httpOnly cookie prevents XSS, but CSRF attack still works: attacker tricks user into clicking a link that performs action (e.g., POST /logout from attacker's domain).

**Why it happens:** Developer assumes httpOnly is sufficient and forgets CSRF is a separate threat.

**How to avoid:** Use double-submit cookie pattern: server sets CSRF token in non-httpOnly cookie, client includes it in `X-CSRF-TOKEN` header. Attacker cannot read token from different domain.

**Warning signs:** No CSRF token validation on POST/PUT/DELETE; `csurf` not installed.

---

### Pitfall 8: Nominatim Rate Limiting Not Respected

**What goes wrong:** Frontend makes 2+ requests/sec to Nominatim, gets blocked or rate-limited.

**Why it happens:** No debouncing on address input; one request per keystroke.

**How to avoid:** Debounce input (wait 500ms after user stops typing) before making API call. Cache results on client (24-hour TTL) and on backend. Consider backend caching layer (Redis) for multi-instance deployments.

**Warning signs:** Every keystroke triggers API call; no cache layer.

---

## Code Examples

Verified patterns from official sources and production best practices:

### Password Hashing (bcrypt)

```javascript
// Source: npm bcrypt official documentation
// https://www.npmjs.com/package/bcrypt

const bcrypt = require('bcrypt');

// On signup: hash password with 12 salt rounds
async function hashPassword(plaintext) {
  const hash = await bcrypt.hash(plaintext, 12); // 12 rounds (production standard)
  return hash;
}

// On login: compare plaintext against hash
async function verifyPassword(plaintext, hash) {
  const isValid = await bcrypt.compare(plaintext, hash);
  return isValid;
}

// IMPORTANT: Use async API (hash, compare) to avoid blocking event loop
// Never use sync versions on server (bcrypt.hashSync, bcrypt.compareSync)
```

### Passport.js JWT Strategy Setup

```javascript
// Source: Passport.js official documentation
// https://www.passportjs.org/packages/passport-jwt/

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const db = require('./db');

const opts = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),    // Authorization: Bearer <token>
    (req) => req.cookies.accessToken              // Or from httpOnly cookie
  ]),
  secretOrKey: process.env.JWT_SECRET
};

passport.use('jwt', new JwtStrategy(opts, async (payload, done) => {
  try {
    const user = await db.query('SELECT id, email FROM users WHERE id = $1', [payload.sub]);
    if (user.rows.length === 0) {
      return done(null, false);
    }
    return done(null, user.rows[0]);
  } catch (err) {
    return done(err);
  }
}));

// Middleware
const requireAuth = passport.authenticate('jwt', { session: false });

module.exports = { requireAuth };
```

### Resend Email Template

```javascript
// Source: Resend official docs
// https://resend.com/docs/send-with-nodejs

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendPasswordResetEmail(email, resetToken) {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const { data, error } = await resend.emails.send({
    from: 'RoadTrip <noreply@roadtrip.app>',
    to: email,
    subject: 'Reset Your RoadTrip Password',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password (valid for 1 hour):</p>
      <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Reset Password
      </a>
      <p>Or paste this link in your browser:</p>
      <p><code>${resetLink}</code></p>
      <p>If you didn't request this, ignore this email.</p>
    `
  });
  
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
  
  return data;
}

module.exports = { sendPasswordResetEmail };
```

### React useAuth Custom Hook

```javascript
// Source: React 19 patterns + modern hooks best practices

import { useState, useCallback, useContext, createContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const signup = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/signup', { email, password });
      setUser({ id: response.data.userId, email });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      setUser({ id: response.data.userId, email });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
    } catch (err) {
      setError('Logout failed');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    user,
    isLoading,
    error,
    signup,
    login,
    logout,
    isAuthenticated: !!user
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach (2026) | When Changed | Impact |
|--------------|-------------------------|--------------|--------|
| localStorage for JWT | httpOnly cookies + CSRF | 2022-2023 | Mitigates XSS attacks; prevents token theft via client-side code |
| Single long-lived token | Refresh token rotation | 2020+ | Minimizes damage from token theft; enables silent re-auth |
| Plaintext passwords in DB | bcrypt hashing | Long ago | Required by every modern framework; GDPR/compliance |
| Email via Nodemailer/SMTP | Third-party services (Resend, SendGrid) | 2020s | Reliable delivery; handles bounces, rate limiting, compliance |
| Password reset via SMS | Password reset via email + secure link | 2010s+ | Email more scalable; link pattern is industry standard |
| Bearer token in URL | Bearer token in Authorization header or cookie | ~2015+ | Prevents token leakage in logs, referer headers |

**Deprecated/outdated:**
- **OAuth 1.0:** Replaced by OAuth 2.0 (2012+). OAuth 1.0 complexity not justified.
- **Session-only auth (no JWT):** Still valid for server-rendered apps; JWT better for SPAs and mobile apps.
- **JSONP for CORS:** Replaced by CORS headers (2010s). JSONP has security issues.

---

## Environment Availability

**Step 2.6: SKIPPED** — Phase 1 has no external service dependencies beyond Node.js runtime, npm, and PostgreSQL (infrastructure provided by phase setup). Resend API key will be configured as environment variable; Nominatim is public API (no key needed). No CLI tools or external services to probe.

---

## Open Questions

1. **Rate limiting strategy (Claude's discretion)**
   - What we know: Industry standard is 5 login attempts / 15 minutes per IP
   - What's unclear: Should we rate-limit by IP, email, or both? Distributed deployment considerations?
   - Recommendation: Start with per-IP rate limiting using `express-rate-limit`. Revise if multi-instance deployment requires shared rate limit store (Redis).

2. **Password complexity requirements (Claude's discretion)**
   - What we know: Minimum 8 characters is baseline security
   - What's unclear: Require special characters, uppercase, numbers? Trade-off UX vs. security.
   - Recommendation: Minimum 8 characters, no complexity rules (research shows passphrase > complexity). Provide real-time feedback on strength.

3. **Refresh token rotation on every request vs. periodic (Claude's discretion)**
   - What we know: Decision D-02 specifies "refresh token rotates on each use"
   - What's unclear: Rotate on every `/refresh` call, or only when near expiry?
   - Recommendation: Rotate on every `/refresh` call (implemented in code examples above). Simpler, slightly more secure.

4. **Silent refresh retry strategy (Claude's discretion)**
   - What we know: Background refresh happens every 14 minutes
   - What's unclear: If refresh fails, should we retry immediately, or let user see login prompt?
   - Recommendation: Single retry after 5-second delay; if still fails, redirect to login with "Session expired" message.

---

## Sources

### Primary (HIGH confidence)

- [Passport.js Official Documentation](https://www.passportjs.org/) — JWT strategy, middleware patterns
- [npm bcrypt Package](https://www.npmjs.com/package/bcrypt) — Password hashing, async API, salt rounds
- [jsonwebtoken npm Package](https://www.npmjs.com/package/jsonwebtoken) — JWT creation/verification, claims
- [Express.js Official Site](https://expressjs.com) — v5.x LTS, error handling
- [PostgreSQL Official Docs](https://www.postgresql.org/docs/) — Connection pooling, table design
- [Resend Email API Docs](https://resend.com/docs) — Email sending, free tier limits (100 emails/day)
- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/) — Rate limiting (1 req/sec), caching encouraged
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) — Password reset best practices, token expiry, single-use enforcement

### Secondary (MEDIUM confidence)

- [Secure Password Reset Tokens (Medium, Jan 2026)](https://vjnvisakh.medium.com/secure-password-reset-tokens-expiry-and-system-design-best-practices-337c6161af5a) — Hashing tokens, expiry, account enumeration prevention
- [JWT + httpOnly Cookies + CSRF (DEV Community)](https://dev.to/petrussola/today-s-rabbit-hole-jwts-in-httponly-cookies-csrf-tokens-secrets-more-1jbp) — Double-submit pattern, implementation details
- [Refresh Token Rotation (Auth.js Guides)](https://authjs.dev/guides/refresh-token-rotation) — Token pair lifecycle, database storage
- [React 19 Authentication Hooks (react.wiki)](https://react.wiki/hooks/authentication-hook/) — Custom useAuth pattern, context API
- [Zustand for Auth State (react.wiki)](https://react.wiki/state-management/zustand-tutorial/) — Lightweight state management for user data

### Tertiary (LOW confidence — WebSearch only)

- [Nominatim Autocomplete React Components (GitHub)](https://github.com/search?q=nominatim+react) — Example libraries exist, patterns inferred from community projects

---

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — All libraries verified on npm registry; versions current (April 2025 releases)
- **Architecture Patterns:** HIGH — JWT + refresh token rotation + CSRF double-submit are industry standard (documented by OWASP, auth.js, Passport.js)
- **Password Reset Flow:** HIGH — Verified against OWASP, multiple sources confirm 1-hour token expiry, hashing, single-use
- **bcrypt Salt Rounds:** HIGH — Confirmed 12 rounds as 2026 standard for production
- **Nominatim Caching:** MEDIUM — Rate limiting policy verified; caching strategy inferred from common patterns (not official spec)
- **Resend Free Tier:** HIGH — Official pricing page confirms 100 emails/day

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days for stable libraries; Resend pricing/limits may change)

---

*Phase: 01-authentication-user-setup*
*Research confidence: HIGH*
*Ready for planning: YES*
