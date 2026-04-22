# Authentication & Authorization

This document describes the authentication and authorization system implemented in this multi-tenant school management platform.

---

## Overview

The system uses a **dual-token authentication strategy** built on JWTs (via `jose`) and secure HTTP-only cookies. On every sign-in, two tokens are issued: a short-lived access token for request authentication, and a long-lived refresh token persisted in the database for silent session renewal. Role-based authorization is enforced at the handler level before any protected resource is accessed.

---

## Tech Stack

| Concern | Library |
|---|---|
| Password hashing | `bcrypt` |
| Token signing / verification | `jose` |
| Token persistence | `Prisma` + MongoDB |
| Schema validation | `Zod` |
| Cookie transport | `Next.js` `NextResponse` cookies API |

---

## Token Architecture

### Access Token
- **Type:** Signed JWT
- **Lifespan:** 15 minutes
- **Storage:** HTTP-only cookie (`access_token`), `path: /`
- **Purpose:** Authenticates individual requests without a database lookup
- **Payload:** `{ userId, role, schoolId }`

### Refresh Token
- **Type:** Cryptographically random 64-character hex string (`crypto.randomBytes(32)`)
- **Lifespan:** 7 days
- **Storage:** HTTP-only cookie (`refresh_token`, `path: /`) on the client; SHA-256 hash stored in the `Token` collection in the database
- **Purpose:** Issues a new access token when the current one expires, without forcing the user to log in again

> Only the **hash** of the refresh token is ever stored in the database. The raw token is sent to the client once and never retained server-side.

---

## Authentication Flow

### 1. Login (`POST /api/auth/login`)

Handles Super Admin login (email + password). All other roles use a `userCode` + password flow on a separate endpoint.

```
Client → POST /api/auth/login { email, password }
  │
  ├── Validate request body with Zod schema
  ├── Look up user by email, confirm role is SUPER_ADMIN
  ├── Verify password against stored bcrypt hash
  ├── Sign a JWT access token  →  set as "access_token" cookie
  ├── Generate refresh token, hash and persist to DB  →  set as "refresh_token" cookie
  └── Return 200 { message: "Login Successful" }
```

 cookie for access token are set as `httpOnly`, `sameSite: lax`, `secure` (in production), and `path: /`.
 whie for refresh token `path:/api/auth/refresh`

---

### 2. Session Retrieval (`getSession`)

Reads and verifies the access token on every protected request.

```
Incoming request
  │
  ├── Read "access_token" cookie
  ├── If missing  →  return { success: false, status: 401 }
  ├── Verify JWT signature and expiry via jose
  ├── If invalid / expired  →  return { success: false, status: 401 }
  └── Return { success: true, accessPayload: { userId, role, schoolId } }
```

`getSession` is a pure utility — it does not set cookies or touch the database. It is called internally by `requireRole`.

---

### 3. Token Refresh (`POST /api/auth/refresh`)

Silently renews the access token using the refresh token. The client calls this endpoint when a `401` with `shouldRefresh: true` is returned from a protected route.

```
Client → POST /api/auth/refresh
  │
  ├── Read "refresh_token" cookie
  ├── If missing  →  return 401
  ├── Hash the raw token (SHA-256) and look up the hash in the DB
  ├── Confirm token type is REFRESH and expiresAt is in the future
  ├── If not found or expired  →  return 401
  ├── Extract { userId, role, schoolId } from the associated user record
  ├── Sign a new access token with the same payload
  ├── Set the new "access_token" cookie on the response (path: /, maxAge: 15min)
  └── Return 200 { message: "Token refreshed" }
```

> **Important:** The route handler must return the `NextResponse` from `refreshTokenHandler` directly — not wrap it in another `NextResponse.json()` call — otherwise the `Set-Cookie` header is stripped from the response.

The refresh token itself is **not rotated** on each use. If rotation is desired for enhanced security, generate a new refresh token, update the database record, and set a new `refresh_token` cookie alongside the new access token.

---

### 4. Role-Based Authorization (`requireRole`)

Guards any protected handler by verifying both session validity and role membership.

```
Protected handler invoked
  │
  ├── Call getSession(req)
  ├── If session invalid  →  return { success: false, status: 401, shouldRefresh: true }
  ├── Destructure { userId, role, schoolId } from accessPayload
  ├── Check that role is in the requiredRoles array
  ├── If insufficient permissions  →  return { success: false, status: 403 }
  └── Return { success: true, userId, role, schoolId }
```

`shouldRefresh: true` in a 401 response signals the client to attempt a token refresh before retrying the original request.

**Usage example:**

```typescript
export const POST = async (req: NextRequest) => {
  const auth = await requireRole(req, ["SUPER_ADMIN"]);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  // auth.userId, auth.role, auth.schoolId are now available
};
```

---

## Role Hierarchy

| Role | Scope | Login method |
|---|---|---|
| `SUPER_ADMIN` | Platform-wide | Email + password |
| `ADMIN` | School-scoped | User code + password |
| All other roles | School-scoped | User code + password |

Only `SUPER_ADMIN` and school-scoped `ADMIN` roles can provision new users. Regular users cannot self-register.

---

## Security Properties

| Property | Implementation |
|---|---|
| Passwords never stored in plaintext | bcrypt hash stored, raw password discarded |
| Refresh tokens never stored in plaintext | SHA-256 hash stored, raw token sent to client once |
| Tokens not accessible to JavaScript | All cookies set with `httpOnly: true` |
| Tokens not sent cross-site | All cookies set with `sameSite: lax` |
| Tokens encrypted in transit (production) | `secure: true` in non-development environments |
| Access tokens are short-lived | 15-minute expiry limits the blast radius of a leaked token |
| Refresh tokens are database-backed | Can be revoked individually by deleting the DB record |

---

## Cookie Reference

| Cookie | `path` | `maxAge` | Notes |
|---|---|---|---|
| `access_token` | `/` | 15 minutes | JWT, verified on every protected request |
| `refresh_token` | `/` | 7 days | Raw token; only the hash is stored in DB |

---

## Key Utility Functions

| Function | Location | Purpose |
|---|---|---|
| `signAccessToken(payload)` | `lib/auth/tokens.ts` | Signs a new JWT access token |
| `verifyAccessToken(token)` | `lib/auth/tokens.ts` | Verifies a JWT and returns its payload |
| `verifyRefreshToken(token)` | `lib/auth/tokens.ts` | Looks up the token hash in DB, returns user payload or `null` |
| `persistRefreshToken(userId)` | `lib/auth/tokens.ts` | Generates, hashes, and stores a refresh token; returns the raw token |
| `buildTokenCookies(res, accessToken, rawRefresh)` | `lib/auth/cookies.ts` | Sets both token cookies on a `NextResponse` |
| `getSession(req)` | `lib/auth/session.ts` | Reads and verifies the access token from cookies |
| `requireRole(req, roles)` | `lib/auth/authorization.ts` | Enforces session validity and role membership |
| `hashPassword(password)` | `lib/auth/crypto.ts` | Hashes a plain-text password with bcrypt |
| `compareHashes(password, hash)` | `lib/auth/crypto.ts` | Verifies a plain-text password against its bcrypt hash |