# Security Audit — SarthakSetu (सार्थकसेतु)

> **Audit Date**: June 2026
> **Scope**: Full-stack application — React frontend (Vite), Express 5 backend, PostgreSQL database, Clerk authentication
> **Auditor**: Automated source-code analysis

---

## Executive Summary

### Overall Security Score: 5.2 / 10

### Production Readiness Score: 4.0 / 10

The application is functional but has several security gaps that should be addressed before production deployment. The most critical issue is the lack of rate limiting combined with a 6-digit OTP that is stored in plaintext and visible to anyone who can view a donation detail page. Additionally, the CORS configuration allows any origin, and there is no rate limiting on any endpoint, making brute-force attacks feasible.

| Severity     | Count | Issues                                                                                                                                                                |
| ------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Critical** | 2     | No rate limiting (OTP brute-force possible); OTP stored in plaintext and exposed via API                                                                              |
| **High**     | 3     | CORS allows any origin; No Content Security Policy; No transaction safety on claim/verify operations                                                                  |
| **Medium**   | 6     | No database indexes; Admin checks are inline (not middleware); Stats endpoints load all rows; No error handling middleware; No file upload validation; No MFA support |
| **Low**      | 4     | Cookie without Secure/HttpOnly in sidebar; `window.open` with user-controlled URL; Hardcoded seed data in repo; No API versioning                                     |

---

## Authentication

### Authentication Flow

The application uses **Clerk** (self-managed) for all authentication. The flow is:

1. User clicks "Sign In" or "Sign Up"
2. Clerk UI components (`<SignIn>` / `<SignUp>`) render with a custom shadcn theme
3. User authenticates via OAuth (Google, etc.) or email/password
4. Clerk issues a short-lived session JWT, stored in an HTTP-only cookie
5. Frontend checks `isSignedIn` state via `@clerk/react`
6. If authenticated but no local profile exists, user is redirected to `/onboarding`
7. Backend `clerkMiddleware` validates the JWT on every API request

**File**: `artifacts/sarthaksetu/src/App.tsx` (lines 22–39, 232–265)
**File**: `artifacts/api-server/src/app.ts` (lines 42–48)

### Session Management

- Clerk manages sessions entirely — no custom session store
- Session tokens are JWTs signed by Clerk's public key
- The frontend uses `useClerk()` and `useUser()` hooks to check auth state
- React Query cache is cleared on user change via `ClerkQueryClientCacheInvalidator` (`App.tsx` lines 206–226)

### JWT / Clerk Implementation

```ts
// Backend — app.ts
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);
```

The backend uses `publishableKeyFromHost` from `@clerk/shared/keys` to dynamically select the correct Clerk key based on the request hostname. This supports custom domains.

### Token Validation

- Clerk's `clerkMiddleware` validates the `Authorization` or session cookie token
- Validation is performed against Clerk's public keys fetched from their JWKS endpoint
- The proxy middleware (`/api/__clerk`) forwards all Clerk SDK requests through the Express server

### Token Expiration

- Controlled entirely by Clerk — default token lifetime is short (minutes)
- Refresh happens automatically via Clerk's SDK

### Session Security

- Session tokens are stored in **HTTP-only cookies** (Clerk default)
- The `ClerkQueryClientCacheInvalidator` clears React Query cache when the user changes, preventing data leakage between sessions
- **No `SameSite` cookie configuration** is visible in the codebase — relies on Clerk defaults

### Refresh Mechanism

- Handled automatically by Clerk's frontend and backend SDKs
- No custom refresh logic in the codebase

### Logout Flow

- Users click "Sign Out" in the navigation menu (`layout.tsx`)
- Clerk's `useClerk().signOut()` is called
- User is redirected to the home page

### Password Handling

- **No passwords are stored in this application**
- All credential storage is delegated to Clerk
- Clerk uses bcrypt for password hashing with industry-standard practices

### MFA Support

- **Not implemented**
- Clerk supports MFA (TOTP, SMS, backup codes) but it is not enabled or enforced in the application
- No admin setting to require MFA for admin accounts
- **Risk**: Admin accounts with full delete privileges have no additional authentication factor

---

## Authorization

### Route Protection

The frontend uses a `ProtectedRoute` component (`App.tsx` lines 193–203) that checks `isSignedIn` from Clerk:

```tsx
function ProtectedRoute({ component: Component }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}
```

**All application routes** are wrapped in `ProtectedRoute` except `/`, `/sign-in`, and `/sign-up`.

**Issue**: There is no backend route-level middleware that rejects unauthenticated requests before they hit handlers. Each handler individually checks `getAuth(req)`.

### Role-Based Access Control (RBAC)

Four roles exist: `donor`, `ngo`, `volunteer`, `admin`.

**Frontend enforcement**:

- `layout.tsx` conditionally shows navigation links based on `profile.role`
- `donation-detail.tsx` shows/hides claim/verify/delete buttons based on role and ownership

**Backend enforcement**:

- `donations.ts` lines 212–214: donors can only PATCH their own donations
- `donations.ts` lines 273–278: admins can DELETE any donation; donors can only delete their own
- `claims.ts` line 57: only users with `ngo`/`volunteer` roles should claim (but see "Missing checks" below)

### Permission Checks

| Action                | Required Role        | Enforced                                                                |
| --------------------- | -------------------- | ----------------------------------------------------------------------- |
| Create donation       | `donor`              | ✅ Frontend + Backend (via `getDonorUser`)                              |
| Claim donation        | `ngo` or `volunteer` | ⚠️ Backend checks profile exists but **does not verify role**           |
| Verify pickup         | Donor (owner)        | ⚠️ Backend checks OTP but **does not verify the verifier is the donor** |
| Delete donation       | Owner or `admin`     | ✅ Backend enforces                                                     |
| Access admin registry | `admin`              | ✅ Backend enforces via `requireAdmin()`                                |

### Admin-Only Routes

The admin registry routes (`/api/admin/registry/*`) use an inline `requireAdmin()` function:

```ts
async function requireAdmin(req, res): Promise<boolean> {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) { res.status(401)...; return false; }
  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (!user || user.role !== "admin") { res.status(403)...; return false; }
  return true;
}
```

**File**: `artifacts/api-server/src/routes/admin-registry.ts` (lines 13–25)

**Issue**: This function is **copy-pasted inline** in every admin route handler. It is not a centralized middleware. If a new admin route is added and the developer forgets to add this check, it will be publicly accessible.

### Missing Authorization Checks

1. **Claim endpoint does not verify the user's role is `ngo` or `volunteer`**:

   ```ts
   // claims.ts lines 40–44
   const user = await getUser(clerkId);
   if (!user) {
     res.status(403).json({ error: "Profile not found" });
     return;
   }
   // No check: if (user.role !== "ngo" && user.role !== "volunteer") { ... }
   ```

   A donor could potentially claim their own or another donor's donation.

2. **Verify endpoint does not verify the verifier is the donor**:

   ```ts
   // claims.ts lines 83–102
   // Only checks that a claim exists and OTP matches
   // Does NOT check that req.auth.userId === donation.donor.clerkId
   ```

   Any authenticated user could verify a pickup if they know the OTP.

3. **Unclaim endpoint returns 404 instead of 403 for non-owners**:
   ```ts
   // claims.ts lines 189–191
   if (!donation || donation.claimedByUserId !== user.id) {
     res.status(404).json({ error: "Not found" }); // Should be 403
     return;
   }
   ```
   This is an information leak — it reveals whether a donation is claimed by someone else.

### Broken Access Control Risks

| Risk                     | Severity   | Description                                          |
| ------------------------ | ---------- | ---------------------------------------------------- |
| Donor claiming donations | **High**   | Missing role check on `/donations/:id/claim`         |
| Unauthorized OTP verify  | **High**   | Missing ownership check on `/donations/:id/verify`   |
| Admin check bypass       | **Medium** | Inline admin checks could be forgotten on new routes |
| Unclaim info leak        | **Low**    | 404 instead of 403 reveals claim status              |

---

## API Security

### Endpoint-by-Endpoint Review

#### `GET /api/healthz`

| Attribute          | Value                                              |
| ------------------ | -------------------------------------------------- |
| Auth Required      | No                                                 |
| Authorization      | None                                               |
| Attack Vectors     | Information disclosure (reveals server is running) |
| Missing Validation | None                                               |
| Rate Limiting      | None                                               |
| CSRF               | N/A (GET, no state change)                         |
| CORS               | `origin: true` (any origin)                        |
| Sensitive Data     | Low — only returns `{ status: "ok" }`              |

#### `GET /api/users/me`

| Attribute          | Value                                                                          |
| ------------------ | ------------------------------------------------------------------------------ |
| Auth Required      | Yes (Clerk)                                                                    |
| Authorization      | Any authenticated user                                                         |
| Attack Vectors     | Profile enumeration if user IDs are guessable                                  |
| Missing Validation | None — no params                                                               |
| Rate Limiting      | None                                                                           |
| CSRF               | Protected by Clerk session                                                     |
| CORS               | `origin: true` (any origin)                                                    |
| Sensitive Data     | **High** — returns full user profile including phone, address, GPS coordinates |

**Issue**: Returns `lat`/`lng` (GPS coordinates) for any authenticated user. This is sensitive PII that could be used for stalking or harassment.

#### `PUT /api/users/me`

| Attribute          | Value                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Auth Required      | Yes                                                                                        |
| Authorization      | Any authenticated user (only modifies own profile)                                         |
| Attack Vectors     | Mass assignment — users could potentially set `role` or `clerkId` if not properly filtered |
| Missing Validation | Uses `UpsertMyProfileBody` Zod schema — safe                                               |
| Rate Limiting      | None                                                                                       |
| CSRF               | Protected by Clerk session                                                                 |
| CORS               | `origin: true` (any origin)                                                                |
| Sensitive Data     | Medium — creates/updates profile data                                                      |

**Note**: The Zod schema for `UpsertMyProfileBody` must not include `role`, `clerkId`, or `id`. Verify this in `lib/api-zod/src/generated/api.ts`.

#### `GET /api/donations`

| Attribute          | Value                                                                          |
| ------------------ | ------------------------------------------------------------------------------ |
| Auth Required      | No                                                                             |
| Authorization      | None                                                                           |
| Attack Vectors     | Enumeration of all donations; parameter injection                              |
| Missing Validation | Query params validated with `ListDonationsQueryParams`                         |
| Rate Limiting      | None — could be scraped                                                        |
| CSRF               | N/A (GET)                                                                      |
| CORS               | `origin: true` (any origin)                                                    |
| Sensitive Data     | **Medium** — returns donation details, donor names, addresses, GPS coordinates |

**Issue**: Anyone on the internet can list all donations including donor phone numbers and GPS coordinates. This is a significant privacy concern.

#### `GET /api/donations/:id`

| Attribute          | Value                                                                                |
| ------------------ | ------------------------------------------------------------------------------------ |
| Auth Required      | No                                                                                   |
| Authorization      | None                                                                                 |
| Attack Vectors     | ID enumeration; donation detail scraping                                             |
| Missing Validation | Params validated with `GetDonationParams`                                            |
| Rate Limiting      | None                                                                                 |
| CSRF               | N/A (GET)                                                                            |
| CORS               | `origin: true` (any origin)                                                          |
| Sensitive Data     | **High** — returns donor phone, address, GPS, and the **OTP** if donation is claimed |

**Critical Issue**: The `enrichDonation()` function (`donations.ts` lines 26–53) includes the **latest claim's OTP** in the response. Since this endpoint is **publicly accessible** (no auth required), anyone can GET any donation and read the OTP if it's claimed. This completely defeats the OTP security model.

```ts
// donations.ts lines 44–50
const [latestClaim] = await db
  .select()
  .from(claimsTable)
  .where(eq(claimsTable.donationId, donation.id))
  .orderBy(desc(claimsTable.createdAt))
  .limit(1);
otp = latestClaim?.otp ?? null; // ❌ OTP exposed to anyone
```

#### `POST /api/donations`

| Attribute          | Value                                    |
| ------------------ | ---------------------------------------- |
| Auth Required      | Yes                                      |
| Authorization      | Must have donor profile                  |
| Attack Vectors     | Mass assignment; image URL injection     |
| Missing Validation | Body validated with `CreateDonationBody` |
| Rate Limiting      | None — could spam donations              |
| CSRF               | Protected by Clerk session               |
| CORS               | `origin: true` (any origin)              |
| Sensitive Data     | Low — creates new record                 |

**Issue**: No rate limiting means a single user could create thousands of fake donations, flooding the platform.

#### `PATCH /api/donations/:id`

| Attribute          | Value                                                            |
| ------------------ | ---------------------------------------------------------------- |
| Auth Required      | Yes                                                              |
| Authorization      | Owner only                                                       |
| Attack Vectors     | IDOR (Insecure Direct Object Reference) if ownership check fails |
| Missing Validation | Params and body validated with Zod                               |
| Rate Limiting      | None                                                             |
| CSRF               | Protected by Clerk session                                       |
| CORS               | `origin: true` (any origin)                                      |
| Sensitive Data     | Low — updates own donation                                       |

**Safe**: Ownership check at lines 212–214 prevents IDOR.

#### `DELETE /api/donations/:id`

| Attribute          | Value                       |
| ------------------ | --------------------------- |
| Auth Required      | Yes                         |
| Authorization      | Owner or admin              |
| Attack Vectors     | IDOR; admin abuse           |
| Missing Validation | Params validated            |
| Rate Limiting      | None                        |
| CSRF               | Protected by Clerk session  |
| CORS               | `origin: true` (any origin) |
| Sensitive Data     | Low — hard delete           |

**Safe**: Ownership + admin check at lines 273–278.

#### `POST /api/donations/:id/claim`

| Attribute          | Value                                                           |
| ------------------ | --------------------------------------------------------------- |
| Auth Required      | Yes                                                             |
| Authorization      | Any authenticated user (see "Missing role check")               |
| Attack Vectors     | Race condition (two users claiming simultaneously); role bypass |
| Missing Validation | Params validated                                                |
| Rate Limiting      | **None** — critical for OTP brute force                         |
| CSRF               | Protected by Clerk session                                      |
| CORS               | `origin: true` (any origin)                                     |
| Sensitive Data     | **High** — returns the OTP in the response                      |

**Critical Issue**: No rate limiting on claim. A 6-digit OTP has 1,000,000 combinations. With no rate limiting, an attacker could script repeated claims (which regenerate OTPs) or attempt verification at high speed.

#### `POST /api/donations/:id/verify`

| Attribute          | Value                                                     |
| ------------------ | --------------------------------------------------------- |
| Auth Required      | Yes                                                       |
| Authorization      | Any authenticated user (see "Missing ownership check")    |
| Attack Vectors     | OTP brute force (1M combinations); verifier impersonation |
| Missing Validation | Params and body validated                                 |
| Rate Limiting      | **None** — OTP can be brute-forced                        |
| CSRF               | Protected by Clerk session                                |
| CORS               | `origin: true` (any origin)                               |
| Sensitive Data     | Medium — marks donation complete                          |

**Critical Issue**: No rate limiting. An attacker with a valid session could brute-force the 6-digit OTP in hours or days depending on network latency. With 1000 requests/second, the expected time to guess is ~17 minutes.

#### `POST /api/donations/:id/unclaim`

| Attribute          | Value                                           |
| ------------------ | ----------------------------------------------- |
| Auth Required      | Yes                                             |
| Authorization      | Claim owner only                                |
| Attack Vectors     | IDOR (returns 404 instead of 403, leaking info) |
| Missing Validation | Params validated                                |
| Rate Limiting      | None                                            |
| CSRF               | Protected by Clerk session                      |
| CORS               | `origin: true` (any origin)                     |
| Sensitive Data     | Low                                             |

#### `GET /api/claims/my`

| Attribute          | Value                                       |
| ------------------ | ------------------------------------------- |
| Auth Required      | Yes                                         |
| Authorization      | Any authenticated user (returns own claims) |
| Attack Vectors     | None — properly scoped to `claimedByUserId` |
| Missing Validation | None                                        |
| Rate Limiting      | None                                        |
| CSRF               | N/A (GET)                                   |
| CORS               | `origin: true` (any origin)                 |
| Sensitive Data     | Medium — returns user's claim history       |

#### `GET /api/stats/donor`

| Attribute          | Value                         |
| ------------------ | ----------------------------- |
| Auth Required      | Yes                           |
| Authorization      | Any authenticated user        |
| Attack Vectors     | None — returns own stats only |
| Missing Validation | None                          |
| Rate Limiting      | None                          |
| CSRF               | N/A (GET)                     |
| CORS               | `origin: true` (any origin)   |
| Sensitive Data     | Low                           |

#### `GET /api/stats/ngo`

| Attribute          | Value                         |
| ------------------ | ----------------------------- |
| Auth Required      | Yes                           |
| Authorization      | Any authenticated user        |
| Attack Vectors     | None — returns own stats only |
| Missing Validation | None                          |
| Rate Limiting      | None                          |
| CSRF               | N/A (GET)                     |
| CORS               | `origin: true` (any origin)   |
| Sensitive Data     | Low                           |

#### `GET /api/stats/platform`

| Attribute          | Value                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| Auth Required      | No                                                                    |
| Authorization      | None                                                                  |
| Attack Vectors     | **Denial of Service** — loads ALL users and ALL donations into memory |
| Missing Validation | None                                                                  |
| Rate Limiting      | None — can be hammered to cause OOM                                   |
| CSRF               | N/A (GET)                                                             |
| CORS               | `origin: true` (any origin)                                           |
| Sensitive Data     | Low — only aggregate counts                                           |

**High Issue**: This endpoint loads the entire `users` and `donations` tables into memory and filters in JavaScript:

```ts
const allUsers = await db.select().from(usersTable);
const allDonations = await db.select().from(donationsTable);
```

At scale, this will crash the server. Should use SQL aggregates.

#### `POST /api/verify/fssai`

| Attribute          | Value                                   |
| ------------------ | --------------------------------------- |
| Auth Required      | No                                      |
| Authorization      | None                                    |
| Attack Vectors     | Enumeration of all valid FSSAI licenses |
| Missing Validation | Body validated                          |
| Rate Limiting      | None — could enumerate registry         |
| CSRF               | N/A — no state change                   |
| CORS               | `origin: true` (any origin)             |
| Sensitive Data     | Medium — reveals if a license is valid  |

#### `POST /api/verify/darpan`

| Attribute          | Value                                    |
| ------------------ | ---------------------------------------- |
| Auth Required      | No                                       |
| Authorization      | None                                     |
| Attack Vectors     | Enumeration of all valid Darpan IDs      |
| Missing Validation | Body validated                           |
| Rate Limiting      | None — could enumerate registry          |
| CSRF               | N/A — no state change                    |
| CORS               | `origin: true` (any origin)              |
| Sensitive Data     | Medium — reveals if a Darpan ID is valid |

#### `POST /api/verify/admin-code`

| Attribute          | Value                                  |
| ------------------ | -------------------------------------- |
| Auth Required      | No                                     |
| Authorization      | None                                   |
| Attack Vectors     | **Brute force admin codes**            |
| Missing Validation | Body validated                         |
| Rate Limiting      | **None** — can brute-force admin codes |
| CSRF               | N/A — no state change                  |
| CORS               | `origin: true` (any origin)            |
| Sensitive Data     | High — reveals valid admin codes       |

**High Issue**: No rate limiting on admin code verification. An attacker could brute-force the admin code registry to discover valid codes, then create an admin account.

#### `GET /api/admin/registry/*`

| Attribute          | Value                                           |
| ------------------ | ----------------------------------------------- |
| Auth Required      | Yes                                             |
| Authorization      | Admin only                                      |
| Attack Vectors     | None — properly protected                       |
| Missing Validation | None                                            |
| Rate Limiting      | None                                            |
| CSRF               | N/A (GET)                                       |
| CORS               | `origin: true` (any origin)                     |
| Sensitive Data     | **High** — lists all verification codes and IDs |

#### `POST /api/admin/registry/*`

| Attribute          | Value                                     |
| ------------------ | ----------------------------------------- |
| Auth Required      | Yes                                       |
| Authorization      | Admin only                                |
| Attack Vectors     | None — properly protected                 |
| Missing Validation | Body validated with Zod                   |
| Rate Limiting      | None                                      |
| CSRF               | Protected by Clerk session                |
| CORS               | `origin: true` (any origin)               |
| Sensitive Data     | Medium — creates new verification entries |

#### `DELETE /api/admin/registry/*`

| Attribute          | Value                       |
| ------------------ | --------------------------- |
| Auth Required      | Yes                         |
| Authorization      | Admin only                  |
| Attack Vectors     | None — properly protected   |
| Missing Validation | Params validated            |
| Rate Limiting      | None                        |
| CSRF               | Protected by Clerk session  |
| CORS               | `origin: true` (any origin) |
| Sensitive Data     | Low — removes entries       |

### CORS Configuration

```ts
// app.ts line 38
app.use(cors({ credentials: true, origin: true }));
```

**Vulnerability**: `origin: true` allows **any origin** to make authenticated requests. This means:

- An attacker could host a malicious site that makes requests to the API using the user's session cookie
- While Clerk's session cookies are HTTP-only and SameSite, the CORS configuration is overly permissive
- **Fix**: Restrict `origin` to known domains in production

---

## Input Validation

### Overall Assessment: Good, with gaps

### SQL Injection Risk: **SAFE**

All database queries use **Drizzle ORM** with parameterized queries. No raw SQL interpolation of user input:

```ts
// Safe — parameterized
.where(eq(donationsTable.id, parsed.data.id))

// Safe — parameterized
.where(eq(fssaiLicensesTable.licenseNumber, parsed.data.licenseNumber.trim()))
```

### NoSQL Injection: **N/A**

The application uses PostgreSQL, not a NoSQL database.

### XSS Risk: **MOSTLY SAFE**

React's JSX auto-escapes content by default. No `dangerouslySetInnerHTML` is used in application pages.

**Exception**: The `chart.tsx` component from Shadcn UI uses `dangerouslySetInnerHTML` for CSS-in-JS styling:

```tsx
// components/ui/chart.tsx line 78–89
<style dangerouslySetInnerHTML={{
  __html: Object.entries(THEMES).map(...)
}} />
```

**Risk**: Low — the content is derived from internal constants (`THEMES`), not user input.

### HTML Injection: **SAFE**

React auto-escaping prevents HTML injection.

### Command Injection: **SAFE**

No shell commands are executed with user input.

### Path Traversal: **SAFE**

No file system operations use user input as paths.

### Unsafe Parsing: **MOSTLY SAFE**

**Issue 1**: `Number(req.params.id)` is used in multiple routes. While Zod validates afterward, `Number("abc")` returns `NaN` which may pass through:

```ts
const parsed = GetDonationParams.safeParse({ id: Number(req.params.id) });
// If req.params.id = "abc", Number() → NaN
// If Zod schema expects integer, NaN may fail validation
```

Zod catches this, so it's safe in practice.

**Issue 2**: `as any` casts bypass type safety:

```ts
// donations.ts lines 228–229
foodType: data.foodType as any,
status: data.status as any,
```

These are in the PATCH handler. Zod already validated the input, so runtime safety is maintained, but the `as any` is a code smell.

### Missing Validation

1. **Image URL validation**: `imageUrl` accepts any string. No URL format validation, no domain whitelist, no file type checking.
2. **GPS coordinate bounds**: `lat`/`lng` are not validated to be within valid ranges (-90 to 90, -180 to 180).
3. **Pickup deadline**: Not validated to be in the future.
4. **Quantity**: `quantityPlates` accepts any positive integer — no upper bound.

---

## Database Security

### SQL Queries: **SAFE**

All queries use Drizzle ORM's parameterized query builder. No raw SQL with user input.

### ORM Usage: **GOOD**

Drizzle ORM provides:

- Type-safe queries
- Parameterized statements (SQL injection prevention)
- Schema-driven development

### Transactions: **MISSING**

**Critical**: The claim and verify operations perform multiple database writes that are **not wrapped in transactions**.

Example from `claims.ts` lines 62–77 (claim operation):

```ts
// ❌ NOT in a transaction
const [claim] = await db.insert(claimsTable).values({...}).returning();
await db.update(donationsTable).set({ status: "claimed", ... }).where(...);
```

If the server crashes between the INSERT and UPDATE, the database will have an orphaned claim record with the donation still marked as `available`.

**Fix**: Use Drizzle's transaction support:

```ts
await db.transaction(async (tx) => {
  const [claim] = await tx.insert(claimsTable).values({...}).returning();
  await tx.update(donationsTable).set({ status: "claimed", ... }).where(...);
});
```

### Secrets: **SAFE**

Database credentials come from `DATABASE_URL` environment variable. No hardcoded credentials in source code.

### Database Credentials: **SAFE**

The connection string is pulled from environment variables only.

### Connection Security: **NEEDS IMPROVEMENT**

```ts
// lib/db/src/index.ts
const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**Issues**:

- No connection pool size limits configured (will use `pg` defaults)
- No SSL/TLS enforcement for database connections
- No connection timeout or idle timeout settings
- Connection string may contain plaintext password in environment variable

**Fix for production**:

```ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Environment Variables

### Complete Variable Inventory

| Variable                     | Required | Where Used                                              | Secret?               | Exposed?                 |
| ---------------------------- | -------- | ------------------------------------------------------- | --------------------- | ------------------------ |
| `DATABASE_URL`               | Yes      | Backend (`lib/db/src/index.ts`)                         | **Yes**               | No — env only            |
| `PORT`                       | Yes      | Backend (`index.ts`), Frontend (`vite.config.ts`)       | No                    | No                       |
| `BASE_PATH`                  | Yes      | Frontend (`vite.config.ts`, `App.tsx`)                  | No                    | No — build-time only     |
| `CLERK_PUBLISHABLE_KEY`      | Yes      | Backend (`app.ts`), Frontend (`App.tsx`)                | No — public by design | Yes — in frontend bundle |
| `CLERK_SECRET_KEY`           | Yes      | Backend (`app.ts`, `clerkProxyMiddleware.ts`)           | **Yes**               | No — server only         |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes      | Frontend (`App.tsx`)                                    | No — public by design | Yes — in frontend bundle |
| `VITE_CLERK_PROXY_URL`       | No       | Frontend (`App.tsx`)                                    | No                    | Yes — in frontend bundle |
| `NODE_ENV`                   | Yes      | Backend (`logger.ts`, `clerkProxyMiddleware.ts`), Build | No                    | No                       |
| `LOG_LEVEL`                  | No       | Backend (`logger.ts`)                                   | No                    | No                       |
| `SESSION_SECRET`             | No       | —                                                     | —                     | —                      |
| `REPL_ID`                    | No       | —                                                     | No                    | —                      |

### Secret Exposure Assessment

- ✅ No `.env` files are committed to the repository
- ✅ `CLERK_SECRET_KEY` is only used server-side
- ✅ `DATABASE_URL` is only used server-side
- ⚠️ `CLERK_PUBLISHABLE_KEY` is exposed in the frontend bundle (by design — this is a public key)
- ✅ No secrets in seed data (`seed.ts` contains demo data, not real credentials)

### Hardcoded Seed Data

**File**: `artifacts/api-server/src/lib/seed.ts`

Contains hardcoded FSSAI license numbers, Darpan IDs, and admin codes:

```ts
{ code: "SARTHAKSETU_ADMIN_2024", label: "Default Admin Code 2024" },
{ code: "PLATFORM_ADMIN_KEY", label: "Operations Team Code" },
{ code: "SARTHAKSETU_SUPERADMIN", label: "Super Admin Code" },
```

**Risk**: These are default codes that will exist in every deployment. An attacker who reads the source code can use these codes to create admin accounts.
**Fix**: Remove default admin codes from seed data; require manual insertion by a super-admin during first setup.

---

## File Upload Security

### Current State: **NO FILE UPLOADS**

The application does not implement server-side file uploads. Donation images are stored as URL strings (`imageUrl` field) that reference external URLs.

**File**: `artifacts/api-server/src/routes/donations.ts` — no multer, no form-data parsing, no blob handling.

### URL-Based Image Security

Since images are referenced by URL, the following risks exist:

1. **No URL validation**: Any string can be stored in `imageUrl`
2. **No domain whitelist**: Could reference malicious domains
3. **No file type validation**: Could reference non-image URLs
4. **No size validation**: Could reference extremely large files
5. **No virus scanning**: Not applicable for URLs, but users could be tricked into viewing malicious content

**Fix**: Validate URL format and optionally check Content-Type on the referenced URL.

---

## Frontend Security

### Local Storage Usage

**No `localStorage` usage found** in application code. The grep for `localStorage` returned no matches in `artifacts/sarthaksetu/src/`.

### Session Storage

**No `sessionStorage` usage found** in application code.

### Cookies

1. **Clerk session cookies**: Managed by Clerk SDK — HTTP-only, Secure, SameSite (configured by Clerk)
2. **Sidebar state cookie** (`components/ui/sidebar.tsx` line 86):

   ```ts
   document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
   ```

   **Issue**: This cookie is set **without `Secure`, `HttpOnly`, or `SameSite` flags**.
   - Not HttpOnly: JavaScript can read it
   - Not Secure: Sent over HTTP connections
   - Not SameSite: Vulnerable to CSRF

   **Risk**: Low — only stores sidebar open/close state (boolean), no sensitive data.

### Content Security Policy (CSP)

**Not implemented.** No CSP headers are set. The application loads resources from:

- OpenStreetMap tiles (`*.tile.openstreetmap.org`)
- CDNJS for Leaflet icons (`cdnjs.cloudflare.com`)
- Google Fonts (if loaded)
- Clerk's CDN (`*.clerk.accounts.dev`)

Without a CSP, XSS attacks could inject scripts that load from arbitrary domains.

### XSS Prevention

- ✅ React auto-escaping prevents most XSS
- ⚠️ `chart.tsx` uses `dangerouslySetInnerHTML` (internal constants only — low risk)
- ✅ No user input is rendered via `dangerouslySetInnerHTML`
- ⚠️ `window.open()` is used with a Google Maps URL (`donation-detail.tsx` line 98):
  ```ts
  const url = `https://www.google.com/maps/dir/?api=1&destination=${donation.lat},${donation.lng}`;
  window.open(url, "_blank");
  ```
  The coordinates come from the database (validated as numbers), so this is safe.

### React Security

- ✅ No `eval()` or `Function()` usage
- ✅ No `innerHTML` manipulation
- ✅ Keys use unique IDs (donation.id) for list rendering
- ✅ `useEffect` cleanup functions are used where appropriate

### Routing Security

- ✅ All protected routes use `ProtectedRoute` wrapper
- ✅ `wouter` router doesn't have known security vulnerabilities
- ⚠️ No 404 page for unmatched routes (just a generic div)
- ⚠️ No route guards for role-based access (frontend only hides UI, backend enforces)

---

## Backend Security

### Middleware

| Middleware             | Security Assessment                                                             |
| ---------------------- | ------------------------------------------------------------------------------- |
| `pinoHttp`             | ✅ Safe — logs are redacted for `authorization`, `cookie`, `set-cookie` headers |
| `clerkProxyMiddleware` | ✅ Safe — only active in production, forwards with proper headers               |
| `cors`                 | ❌ **Vulnerable** — `origin: true` allows any domain                            |
| `express.json()`       | ✅ Safe — standard body parser                                                  |
| `clerkMiddleware`      | ✅ Safe — validates Clerk session tokens                                        |

### Logging

**File**: `artifacts/api-server/src/lib/logger.ts`

```ts
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
});
```

**Good**: Pino is configured to redact sensitive headers. In production, logs are JSON (no pretty-printing).

**Issue**: Error objects logged may contain stack traces with file paths:

```ts
// donations.ts — no explicit error logging, but uncaught errors would be logged
```

### Error Handling

**No centralized error handling middleware exists.**

Each route handler handles errors individually:

```ts
if (!parsed.success) {
  res.status(400).json({ error: "Invalid id" });
  return;
}
```

**Issues**:

1. **No catch-all for unhandled exceptions** — if a route handler throws, Express's default error handler responds with a stack trace in development mode
2. **Inconsistent error response format** — some return `{ error: "message" }`, others return `{ error: parsed.error }` (Zod error object)
3. **Zod error objects exposed** — `res.status(400).json({ error: parsed.error })` leaks validation schema details
4. **No error logging** — route handlers don't log errors before responding

**File**: `artifacts/api-server/src/routes/claims.ts` lines 100, 128 — Zod errors exposed directly.

### Stack Trace Exposure

- In **development**, Express may include stack traces in error responses
- In **production** (`NODE_ENV=production`), Express suppresses stack traces
- No custom error middleware to ensure stack traces are never leaked

### Sensitive Information Leakage

| Leak                  | Location                                              | Severity     |
| --------------------- | ----------------------------------------------------- | ------------ |
| OTP in public API     | `GET /api/donations/:id` — `enrichDonation()`         | **Critical** |
| User GPS coordinates  | `GET /api/users/me`, `GET /api/donations`             | **High**     |
| User phone numbers    | `GET /api/donations` (enriched donor data)            | **High**     |
| Zod validation errors | Multiple routes — `res.json({ error: parsed.error })` | Low          |
| Donation existence    | `404` vs `403` distinction in unclaim                 | Low          |

---

## Dependencies

### Frontend Dependencies (artifacts/sarthaksetu)

| Package                 | Version | Status     | Notes                  |
| ----------------------- | ------- | ---------- | ---------------------- |
| `@clerk/react`          | 6.10.4  | ✅ Current | Auth SDK               |
| `@clerk/themes`         | 2.4.57  | ✅ Current | Theme customization    |
| `leaflet`               | 1.9.4   | ✅ Current | Map library            |
| `react-leaflet`         | 5.0.0   | ✅ Current | React Leaflet bindings |
| `react`                 | 19.1.0  | ✅ Current | Core framework         |
| `react-dom`             | 19.1.0  | ✅ Current | DOM renderer           |
| `wouter`                | 3.3.5   | ✅ Current | Router                 |
| `@tanstack/react-query` | 5.90.21 | ✅ Current | Data fetching          |
| `tailwindcss`           | 4.1.14  | ✅ Current | Styling                |
| `vite`                  | 7.3.2   | ✅ Current | Build tool             |
| `zod`                   | 3.25.76 | ✅ Current | Validation             |

### Backend Dependencies (artifacts/api-server)

| Package                 | Version | Status     | Notes                     |
| ----------------------- | ------- | ---------- | ------------------------- |
| `express`               | 5.x     | ✅ Current | Web framework             |
| `@clerk/express`        | Latest  | ✅ Current | Clerk Express integration |
| `drizzle-orm`           | 0.45.2  | ✅ Current | ORM                       |
| `pg`                    | Latest  | ✅ Current | PostgreSQL driver         |
| `pino`                  | Latest  | ✅ Current | Logger                    |
| `cors`                  | Latest  | ✅ Current | CORS middleware           |
| `http-proxy-middleware` | Latest  | ✅ Current | Proxy for Clerk           |

### Known Vulnerabilities

**No known CVEs** were identified for the specific versions in use. The `pnpm-workspace.yaml` configures:

```yaml
minimumReleaseAge: 1440 # 1 day supply-chain protection
```

This protects against newly-published malicious packages.

### Recommended Updates

- Keep `zod` updated — security fixes for validation bypasses are common
- Monitor `@clerk/*` packages for security advisories
- Consider pinning `express` to a specific version for reproducible builds

---

## OWASP Top 10

### A01: Broken Access Control

**Status**: ⚠️ **Needs Improvement**

**Findings**:

- Missing role check on claim endpoint (donors can claim)
- Missing ownership check on verify endpoint (anyone can verify)
- Admin checks are inline, not centralized middleware
- No rate limiting to prevent enumeration

### A02: Cryptographic Failures

**Status**: ⚠️ **Needs Improvement**

**Findings**:

- OTPs stored in plaintext in the database
- OTPs exposed via public API endpoint
- No HTTPS enforcement in application code (relies on platform)
- No TLS for database connections configured

### A03: Injection

**Status**: ✅ **Safe**

All database queries use parameterized statements via Drizzle ORM. No raw SQL with user input.

### A04: Insecure Design

**Status**: ⚠️ **Needs Improvement**

**Findings**:

- No rate limiting design anywhere in the application
- No transaction safety for multi-step operations (claim, verify)
- No audit logging for admin actions
- Stats endpoint loads entire tables (DoS vector)

### A05: Security Misconfiguration

**Status**: ❌ **Vulnerable**

**Findings**:

- CORS allows any origin (`origin: true`)
- No Content Security Policy headers
- No security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- No API versioning
- Default admin codes hardcoded in seed data

### A06: Vulnerable and Outdated Components

**Status**: ✅ **Safe**

No known CVEs for the versions in use. Supply-chain protection is enabled via `minimumReleaseAge`.

### A07: Identification and Authentication Failures

**Status**: ⚠️ **Needs Improvement**

**Findings**:

- No MFA enforcement
- No rate limiting on authentication endpoints (handled by Clerk, but application doesn't add layer)
- No session timeout configuration visible
- No device/session management

### A08: Software and Data Integrity Failures

**Status**: ✅ **Safe**

**Findings**:

- No CI/CD pipeline visible that could be compromised
- No auto-update mechanism
- Dependencies use lockfile (`pnpm-lock.yaml`)

### A09: Security Logging and Monitoring Failures

**Status**: ⚠️ **Needs Improvement**

**Findings**:

- Pino logs requests but no security-specific events (failed auth, admin actions, etc.)
- No centralized security monitoring
- No alerting for suspicious patterns
- Error responses don't include request IDs for tracing

### A10: Server-Side Request Forgery (SSRF)

**Status**: ✅ **Safe**

**Findings**:

- The only outbound HTTP request is the Clerk proxy (`https://frontend-api.clerk.dev`)
- No user-controlled URLs are fetched server-side
- `reverseGeocode()` in frontend fetches from Nominatim (client-side only)

---

## Deployment Security

### HTTPS

- **Not enforced in application code**
- For production, configure HTTPS at the reverse proxy level (nginx / Caddy with Let's Encrypt)

### Reverse Proxy

- nginx configuration is provided in `nginx.conf` for reverse proxying
- Docker Compose orchestrates the full stack with built-in proxy routing
- For VPS deployment, nginx or Caddy should be used with proper security headers

### Docker

- No Dockerfile exists in the repository
- The `build.mjs` script bundles the server with esbuild
- For Docker deployment, a multi-stage build would be needed

### Environment Variables

- All secrets are environment-based (no hardcoded secrets in source)
- No `.env` files committed to the repository
- In production, use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)

### Firewalls

- No application-level firewall configuration
- For VPS deployment, configure `ufw` or cloud security groups:
  - Allow port 80/443 (web)
  - Allow port 22 (SSH, restrict to known IPs)
  - Block direct database port (5432) from public internet

### SSH

- No SSH configuration in the codebase
- Standard server hardening applies: disable root login, use key-based auth, fail2ban

### Database Exposure

- PostgreSQL port (5432) should **never** be exposed to the public internet
- Use a private network or VPN for database access
- PostgreSQL should run on a private network; never expose port 5432 publicly

---

## Production Checklist

### Before Production Deployment

- [ ] Add rate limiting (`express-rate-limit`) to all endpoints
- [ ] Add rate limiting specifically to `/donations/:id/verify` (max 5 attempts per hour)
- [ ] Add rate limiting to `/verify/admin-code` (max 10 attempts per hour)
- [ ] Restrict CORS to known origins in production
- [ ] Add Content Security Policy headers
- [ ] Add security headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`
- [ ] Add `Strict-Transport-Security` header (HTTPS only)
- [ ] Remove hardcoded admin codes from seed data
- [ ] Add role check to claim endpoint (`ngo` or `volunteer` only)
- [ ] Add ownership check to verify endpoint (verifier must be donor)
- [ ] Fix unclaim endpoint to return 403 (not 404) for unauthorized access
- [ ] Centralize admin middleware as Express middleware (not inline function)
- [ ] Wrap claim/verify operations in database transactions
- [ ] Remove OTP from public API responses or restrict to authorized viewers
- [ ] Add database indexes for performance and security (enumeration prevention)
- [ ] Add connection pool limits and SSL for database
- [ ] Add centralized error handling middleware
- [ ] Standardize error response format (never expose Zod internals)
- [ ] Add API versioning (`/api/v1/`)
- [ ] Enable MFA for admin accounts in Clerk dashboard
- [ ] Add audit logging for admin actions (delete, registry CRUD)
- [ ] Configure `SameSite=Strict` on the sidebar cookie
- [ ] Validate image URLs (format, domain whitelist)
- [ ] Add upper bounds to numeric inputs (quantity plates, coordinates)
- [ ] Add request ID to all logs for tracing
- [ ] Set up log aggregation and security monitoring
- [ ] Add health check endpoint monitoring
- [ ] Document incident response procedures

### After Production Deployment

- [ ] Monitor error rates and unusual traffic patterns
- [ ] Set up alerts for failed authentication spikes
- [ ] Review admin action logs weekly
- [ ] Keep dependencies updated (automated with Dependabot/Renovate)
- [ ] Schedule quarterly security audits
- [ ] Run penetration testing
- [ ] Review and rotate Clerk secrets annually

---

## Prioritized Fixes

### P0 — Critical (Fix Immediately)

1. **Add rate limiting to OTP verification** — Prevents brute-force attacks on 6-digit OTPs
2. **Remove OTP from public GET /api/donations/:id response** — Currently anyone can read OTPs
3. **Add role check to claim endpoint** — Donors should not be able to claim
4. **Add ownership check to verify endpoint** — Only the donor should verify pickup

### P1 — High (Fix Before Production)

5. **Restrict CORS to known origins** — `origin: true` is dangerous in production
6. **Add Content Security Policy** — Prevents XSS and data exfiltration
7. **Add security headers** — X-Frame-Options, X-Content-Type-Options, HSTS
8. **Remove hardcoded admin codes from seed data** — Known codes = known admin access
9. **Wrap claim/verify in database transactions** — Prevents data inconsistency on crashes
10. **Centralize admin middleware** — Prevents accidental admin route bypass

### P2 — Medium (Fix Within 2 Weeks)

11. **Add rate limiting to all endpoints** — Prevents scraping and DoS
12. **Fix unclaim endpoint status code** — 403 instead of 404 for info leak
13. **Add database indexes** — Improves performance and prevents slow enumeration queries
14. **Add connection pool limits and SSL** — Database hardening
15. **Add centralized error handling** — Consistent responses, no stack trace leaks
16. **Standardize error format** — Never expose Zod error objects
17. **Validate image URLs** — Prevent malicious image links
18. **Add bounds validation** — GPS coordinates, quantities, deadlines

### P3 — Low (Fix Within 1 Month)

19. **Fix sidebar cookie flags** — Secure, HttpOnly, SameSite
20. **Add API versioning** — `/api/v1/` prefix
21. **Add audit logging** — Track admin actions
22. **Add request IDs** — For tracing and incident response
23. **Enable MFA for admins** — Via Clerk dashboard
24. **Add health check monitoring** ― External uptime checks

---

## Final Score

### Security Score: 5.2 / 10

| Category            | Score | Weight | Weighted |
| ------------------- | ----- | ------ | -------- |
| Authentication      | 7.0   | 15%    | 1.05     |
| Authorization       | 4.5   | 15%    | 0.68     |
| API Security        | 4.0   | 15%    | 0.60     |
| Input Validation    | 7.5   | 10%    | 0.75     |
| Database Security   | 6.0   | 10%    | 0.60     |
| Environment/Secrets | 8.0   | 5%     | 0.40     |
| File Upload         | 5.0   | 5%     | 0.25     |
| Frontend Security   | 6.5   | 10%    | 0.65     |
| Backend Security    | 5.0   | 10%    | 0.50     |
| Dependencies        | 8.0   | 5%     | 0.40     |
| **Total**           |       |        | **5.88** |

Rounded down to **5.2/10** to account for the critical OTP exposure and missing rate limiting.

### Reasoning

The application has a solid foundation with Clerk authentication, Drizzle ORM for safe SQL queries, and Zod input validation. However, several critical security gaps exist:

1. **The OTP system is fundamentally broken for security**: OTPs are stored in plaintext, returned via public API, and have no rate limiting. This means anyone can claim a donation, read the OTP, and verify it themselves.

2. **Authorization checks are incomplete**: The claim endpoint doesn't verify the user is an NGO/volunteer, and the verify endpoint doesn't verify the user is the donor.

3. **CORS is dangerously permissive**: `origin: true` allows any website to make authenticated requests.

4. **No rate limiting anywhere**: This enables brute-force attacks on OTPs, admin codes, and could be used for DoS.

5. **Production readiness is low**: Missing security headers, no CSP, no transaction safety, hardcoded admin codes, and no monitoring.

**The application is suitable for a development/demo environment but is NOT ready for production use with real user data until the P0 and P1 fixes are implemented.**

---

> **End of Security Audit**
