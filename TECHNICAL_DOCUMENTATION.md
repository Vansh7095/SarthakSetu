# SarthakSetu (सार्थकसेतु) — Complete Technical Documentation

> **Project**: SarthakSetu — A food donation platform connecting surplus food donors (restaurants, hotels, caterers, households) with NGOs and volunteers to reduce food waste in India.
> **Repository Type**: pnpm monorepo with TypeScript
> **Last Updated**: June 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder & File Structure](#2-folder--file-structure)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database](#5-database)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Documentation](#7-api-documentation)
8. [Application Flow](#8-application-flow)
9. [Dependencies](#9-dependencies)
10. [Configuration](#10-configuration)
11. [Architecture Diagrams](#11-architecture-diagrams)
12. [Performance Analysis](#12-performance-analysis)
13. [Security Audit](#13-security-audit)
14. [Code Quality Review](#14-code-quality-review)
15. [Deployment Guide](#15-deployment-guide)
16. [Future Improvements](#16-future-improvements)
17. [README](#17-readme)

---

## 1. Project Overview

### 1.1 Purpose

SarthakSetu is a full-stack web application designed to bridge the gap between food surplus and food insecurity in India. Donors (restaurants, event organizers, caterers, hotels, households) can list surplus food. NGOs and volunteers can browse, claim, and collect these donations. An OTP-based handover system ensures accountability at pickup.

### 1.2 Main Features

| Feature                        | Description                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Donor Registration**         | Role-based onboarding with FSSAI license verification for businesses                                                         |
| **NGO/Volunteer Registration** | Darpan ID verification for NGOs, simple registration for volunteers                                                          |
| **Food Donation Listings**     | Create listings with food name, type (vegetarian only), quantity, prep time, pickup deadline, GPS location, and photo        |
| **Interactive Map**            | Color-coded Leaflet markers (green=household, yellow=restaurant, orange=caterer, red=urgent) showing all available donations |
| **Inline Routing**             | Dashed route line drawn on the map from user location to donation destination                                                |
| **Claim System**               | NGOs click "Claim" → 6-digit OTP generated → at pickup, donor enters OTP → status becomes "completed"                        |
| **OTP Visibility**             | Donors viewing claimed donations see the OTP directly on the detail page                                                     |
| **Dashboards**                 | Donors see plates shared & recent donations; NGOs see claims & plates collected; public platform stats                       |
| **Admin Panel**                | Protected admin dashboard for managing FSSAI licenses, Darpan IDs, and admin access codes                                    |
| **Admin Delete**               | Platform admins can delete any donation regardless of ownership                                                              |
| **Auto-Cleanup**               | Expired donations (past pickup deadline, not completed) are auto-deleted every 5 minutes                                     |
| **Veg-Only Lock**              | The platform only accepts vegetarian food; non-veg options are removed from UI                                               |

### 1.3 Overall Architecture

The project follows a **contract-first API design** pattern:

1. The OpenAPI spec (`lib/api-spec/openapi.yaml`) is the single source of truth
2. The frontend uses auto-generated React Query hooks (`lib/api-client-react`)
3. The backend uses auto-generated Zod schemas (`lib/api-zod`) for validation
4. Both sides share exact TypeScript types through the generated code

### 1.4 Technology Stack

| Layer               | Technology                    | Version        | Purpose                                           |
| ------------------- | ----------------------------- | -------------- | ------------------------------------------------- |
| **Frontend**        | React + Vite                  | 19.1.0 / 7.3.2 | SPA with HMR, Tailwind v4 integration             |
| **Routing**         | wouter                        | 3.3.5          | Lightweight router, ~1.5KB                        |
| **UI Components**   | Radix UI + Shadcn             | —              | Accessible, unstyled primitives + styled wrappers |
| **Styling**         | Tailwind CSS v4               | 4.1.14         | Utility-first CSS with CSS-based config           |
| **State (Server)**  | TanStack Query                | 5.90.21        | Caching, deduping, background refetching          |
| **Forms**           | react-hook-form + zod         | —              | Performant forms with schema validation           |
| **Maps**            | react-leaflet + OpenStreetMap | —              | Free, no-API-key interactive maps                 |
| **Backend**         | Express 5                     | 5.x            | HTTP server framework                             |
| **Auth**            | Clerk (self-managed)          | —              | OAuth, SSO, session management                    |
| **Database**        | PostgreSQL + Drizzle ORM      | 0.45.2         | Type-safe SQL with migrations                     |
| **Validation**      | Zod (v3 + v4)                 | —              | Runtime schema validation                         |
| **Codegen**         | Orval                         | —              | OpenAPI → React Query + Zod                       |
| **Build (Server)**  | esbuild                       | 0.27.3         | Fast bundling with ESM output                     |
| **Logging**         | pino + pino-pretty            | —              | Structured JSON logging                           |
| **Package Manager** | pnpm                          | —              | Workspaces, catalog dependencies                  |

### 1.5 Design Patterns Used

- **Contract-First Design**: OpenAPI spec drives all API contracts
- **Monorepo with Shared Libraries**: `lib/*` packages shared across artifacts
- **OTP Handshake Pattern**: Claim → OTP → Verify → Complete
- **Role-Based Access Control (RBAC)**: UI and API both enforce role checks
- **Controlled Sheet State**: Mobile menu uses React state for open/close
- **Background Job Pattern**: Cleanup timer runs on server startup
- **Proxy Pattern**: Clerk requests proxied through Express to avoid DNS issues

---

## 2. Folder & File Structure

```
workspace/
├── artifacts/                          # Deployable applications
│   ├── sarthaksetu/                        # React frontend (Vite)
│   │   ├── public/                     # Static assets (hero.png, favicon.svg)
│   │   ├── src/
│   │   │   ├── App.tsx                 # Root component: ClerkProvider, routing, auth guards
│   │   │   ├── main.tsx                # Entry point: mounts React app
│   │   │   ├── index.css               # Tailwind theme tokens, CSS variables
│   │   │   ├── lib/
│   │   │   │   ├── queryClient.ts      # TanStack Query client config
│   │   │   │   └── utils.ts            # cn() helper for Tailwind class merging
│   │   │   ├── components/
│   │   │   │   ├── layout.tsx          # Header, mobile nav, role-based nav links
│   │   │   │   └── ui/                 # 50+ Shadcn UI components (Button, Sheet, Input, etc.)
│   │   │   ├── pages/
│   │   │   │   ├── home.tsx            # Landing page with stats, hero, how-it-works
│   │   │   │   ├── onboarding.tsx      # Multi-step role selection & profile creation
│   │   │   │   ├── dashboard.tsx       # Role-specific stats dashboard
│   │   │   │   ├── donate.tsx          # Food donation form with Leaflet map picker
│   │   │   │   ├── donations.tsx       # Browse/search available donations
│   │   │   │   ├── donation-detail.tsx # View, claim, verify OTP, admin delete
│   │   │   │   ├── map.tsx             # Interactive map with color-coded markers & inline routing
│   │   │   │   ├── my-donations.tsx    # Donor's own listings
│   │   │   │   ├── my-claims.tsx       # NGO's claimed donations
│   │   │   │   ├── profile.tsx         # View/edit user profile
│   │   │   │   └── admin-registry.tsx  # Admin: manage verification registries
│   │   │   └── hooks/
│   │   │       └── use-toast.ts        # Toast notification hook
│   │   ├── index.html                  # HTML shell with meta tags
│   │   ├── vite.config.ts              # Vite config: base path, aliases, plugins
│   │   └── package.json
│   │
│   ├── api-server/                     # Express 5 backend
│   │   ├── src/
│   │   │   ├── index.ts                # Entry point: port binding, cleanup job, seed
│   │   │   ├── app.ts                  # Express app: middleware stack, route mounting
│   │   │   ├── routes/
│   │   │   │   ├── index.ts            # Router aggregator
│   │   │   │   ├── health.ts           # GET /healthz
│   │   │   │   ├── users.ts            # GET /users/me, PUT /users/me
│   │   │   │   ├── donations.ts        # CRUD + enrichment + admin delete
│   │   │   │   ├── claims.ts           # Claim, unclaim, verify OTP
│   │   │   │   ├── stats.ts            # Donor, NGO, platform stats
│   │   │   │   ├── verify.ts           # FSSAI, Darpan, admin-code verification
│   │   │   │   └── admin-registry.ts   # CRUD for FSSAI/Darpan/Admin registries
│   │   │   ├── middlewares/
│   │   │   │   └── clerkProxyMiddleware.ts  # Proxies /api/__clerk to Clerk
│   │   │   ├── lib/
│   │   │   │   ├── logger.ts           # Pino logger singleton
│   │   │   │   └── seed.ts             # Seeds verification tables if empty
│   │   │   └── types/
│   │   │       └── pino.d.ts          # Pino type declarations
│   │   ├── build.mjs                   # esbuild script for server bundling
│   │   └── package.json
│   │
│   └── mockup-sandbox/                 # Component preview server (Vite)
│       └── ...
│
├── lib/                                # Shared libraries
│   ├── api-spec/                       # OpenAPI spec + Orval config
│   │   ├── openapi.yaml                # Single source of truth for API
│   │   ├── orval.config.ts             # Codegen configuration
│   │   └── package.json
│   │
│   ├── api-client-react/               # Generated React Query hooks (DO NOT EDIT)
│   │   └── src/generated/
│   │       ├── api.ts                  # All fetch functions
│   │       ├── api.schemas.ts          # All TypeScript interfaces
│   │       └── api.schemas.types.ts    # Re-exported types
│   │
│   ├── api-zod/                        # Generated Zod schemas (DO NOT EDIT)
│   │   └── src/generated/
│   │       ├── api.ts                  # Main Zod schemas
│   │       └── types/                  # One file per schema type
│   │
│   └── db/                             # Database schema + connection
│       ├── src/
│       │   ├── index.ts                # Drizzle client + pool setup
│       │   └── schema/
│       │       ├── index.ts            # Barrel export
│       │       ├── users.ts            # users table + enums
│       │       ├── donations.ts        # donations table + enums
│       │       ├── claims.ts           # claims table
│       │       └── verifications.ts    # fssai_licenses, darpan_ids, admin_codes
│       └── package.json
│
├── scripts/                            # Utility scripts
│   └── src/
│       └── hello.ts                    # Placeholder script
│
├── pnpm-workspace.yaml                 # Workspace definition + security settings
├── tsconfig.base.json                  # Shared TypeScript strict defaults
├── tsconfig.json                       # Solution file for composite libs
├── package.json                        # Root scripts + dev tooling
└── replit.md                           # Project README + user preferences
```

### 2.1 Key File Responsibilities

| File                                          | Responsibility                                                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `openapi.yaml`                                | The **single source of truth** for all API contracts. Any API change starts here.                                |
| `lib/db/src/schema/*.ts`                      | Database schema definitions. Drizzle reads these to generate migrations and provide type inference.              |
| `lib/db/src/index.ts`                         | Creates the `pg.Pool` and `drizzle()` client. Exported as `db` and `pool` for all DB operations.                 |
| `artifacts/api-server/src/app.ts`             | Express middleware stack: pino logging → Clerk proxy → CORS → JSON parser → Clerk auth → `/api` routes.          |
| `artifacts/api-server/src/index.ts`           | Server bootstrap: validates PORT, seeds verification tables, starts cleanup interval, binds to port.             |
| `artifacts/sarthaksetu/src/App.tsx`               | Root component: ClerkProvider with proxy URL, wouter routing, conditional onboarding redirect, theme appearance. |
| `artifacts/sarthaksetu/src/components/layout.tsx` | Persistent header with mobile Sheet menu (auto-closing), role-based navigation links, sign-out.                  |
| `lib/api-spec/orval.config.ts`                | Configures Orval to generate hooks (frontend) and Zod schemas (backend) from openapi.yaml.                       |

---

## 3. Frontend Architecture

### 3.1 UI Architecture

The frontend is a **Single Page Application (SPA)** built with React and Vite. It uses:

- **Component Model**: Function components with hooks. No class components.
- **Component Library**: Shadcn UI (built on Radix UI primitives) provides 50+ accessible, customizable components. All UI components live in `src/components/ui/`.
- **Theme System**: Tailwind CSS v4 with custom theme tokens in `src/index.css`:
  - Primary: Saffron orange (`hsl(28 90% 55%)`)
  - Secondary: Fresh green (`hsl(120 40% 40%)`)
  - Accent: Turmeric yellow (`hsl(45 95% 55%)`)
  - Background: Warm cream (`hsl(40 33% 98%)`)
  - Font: Playfair Display (serif) for headings, Outfit/Inter (sans) for body

### 3.2 Routing and Navigation

```tsx
// From App.tsx — all routes are wrapped in a Layout
<Switch>
  <Route path="/" component={Home} />
  <Route path="/sign-in" component={SignInPage} />
  <Route path="/sign-up" component={SignUpPage} />
  <Route path="/onboarding" component={Onboarding} />
  <Route path="/dashboard" component={Dashboard} />
  <Route path="/donate" component={Donate} />
  <Route path="/donations" component={Donations} />
  <Route path="/donations/:id" component={DonationDetail} />
  <Route path="/map" component={MapView} />
  <Route path="/my-donations" component={MyDonations} />
  <Route path="/my-claims" component={MyClaims} />
  <Route path="/profile" component={Profile} />
  <Route path="/admin/registry" component={AdminRegistry} />
</Switch>
```

**Router**: `wouter` — a ~1.5KB minimal router. Uses `<Link>` and `useLocation()` for navigation. No nested routes. Base path handled via `import.meta.env.BASE_URL`.

**Auth Guard**: `App.tsx` checks if the user is signed in but has no profile. If so, it redirects to `/onboarding`:

```tsx
if (isSignedIn && !profile && !isAuthRoute) {
  setLocation("/onboarding");
}
```

### 3.3 Components and Relationships

```
App.tsx (root)
├── ClerkProvider (auth context)
├── QueryClientProvider (data context)
└── Layout (persistent shell)
    ├── header
    │   ├── Sheet (mobile menu)
    │   └── nav links (role-based)
    └── main content area
        ├── home.tsx
        ├── dashboard.tsx
        ├── donate.tsx
        │   └── MapContainer (Leaflet)
        ├── donation-detail.tsx
        ├── map.tsx
        │   ├── MapContainer
        │   ├── LocateButton
        │   ├── FitBounds
        │   └── Markers + Polyline (route)
        ├── donations.tsx
        ├── my-donations.tsx
        ├── my-claims.tsx
        ├── onboarding.tsx
        │   └── Multi-step form wizard
        ├── profile.tsx
        └── admin-registry.tsx
```

### 3.4 State Management

**Server State**: TanStack Query (React Query)

- All server data is fetched through auto-generated hooks from `lib/api-client-react`
- Example: `const { data: donation } = useGetDonation(id)`
- Query keys are automatically managed. Cache invalidation happens manually after mutations:

```tsx
queryClient.invalidateQueries({ queryKey: getListDonationsQueryKey() });
```

**Client State**: React `useState` and `useRef`

- No global state manager (Zustand, Redux, Context) is used
- Form state managed by `react-hook-form`
- Sheet open/close state managed by `useState` in `layout.tsx`
- Map state (user position, route destination) managed by `useState` in `map.tsx`

### 3.5 Forms, Validation, and User Interactions

**Form Framework**: `react-hook-form` + `@hookform/resolvers` + `zod`

Example from `donate.tsx`:

```tsx
const form = useForm({
  resolver: zodResolver(donationSchema),
  defaultValues: { foodName: "", quantityPlates: 10, ... }
});
```

**Validation**: Frontend uses `zod` schemas defined inline. Backend uses generated Zod schemas from `lib/api-zod`.

**User Interactions**:

- Map pin drag → reverse geocoding via Nominatim API
- Claim button → mutation → OTP generated on server
- Verify button → mutation → donation marked "completed"
- Admin delete button → DELETE mutation → no confirmation dialog

### 3.6 Styling System

Tailwind CSS v4 with CSS-based configuration (no `tailwind.config.js`). Tokens defined in `src/index.css` under `@theme inline`.

Key features:

- Dark mode support via `.dark` class
- Custom CSS variables for colors, fonts, radius
- `cn()` utility from `tailwind-merge` + `clsx` for conditional class merging
- Responsive design via Tailwind breakpoints (`sm:`, `md:`, `lg:`)

### 3.7 Data Flow Through Frontend

```
User Action (click/submit)
  ↓
React Hook Form (validation)
  ↓
Generated Mutation Hook (e.g., useCreateDonation)
  ↓
Custom Fetch Wrapper (from api.ts)
  ↓
HTTP Request → /api/donations
  ↓
On Success: invalidateQueries() to refresh lists
  ↓
React Query refetches → UI updates
```

---

## 4. Backend Architecture

### 4.1 Server Architecture

The backend is a **single Express 5 application** with a flat route structure. There is no separate controller/service/model layer — route handlers directly interact with the database using Drizzle ORM.

```
Request
  ↓
Express App
  ├── pinoHttp (logging)
  ├── Clerk Proxy (/api/__clerk)
  ├── CORS
  ├── express.json() / urlencoded()
  ├── clerkMiddleware (auth)
  └── /api Router
        ├── /healthz
        ├── /users/me
        ├── /donations
        ├── /donations/:id/claim
        ├── /donations/:id/unclaim
        ├── /donations/:id/verify
        ├── /claims/my
        ├── /stats/*
        ├── /verify/*
        └── /admin/registry/*
```

### 4.2 Request Lifecycle

1. **Incoming HTTP request** hits the Express app
2. **pinoHttp** logs request method and URL
3. **Clerk Proxy** intercepts `/api/__clerk/*` and forwards to Clerk's Frontend API
4. **CORS** allows cross-origin requests with credentials
5. **Body parsers** parse JSON and URL-encoded bodies
6. **clerkMiddleware** validates the session token in the `Authorization` header. If valid, it sets `req.auth.userId` (Clerk ID)
7. **Route handler** receives the request
8. **Route handler** uses `getAuth(req)` to extract the Clerk ID
9. **Route handler** queries the `users` table to find the internal user ID
10. **Route handler** performs business logic (DB queries, validation)
11. **Route handler** sends JSON response
12. **pinoHttp** logs response status code and duration

### 4.3 Middleware

| Middleware             | File                      | Purpose                                           |
| ---------------------- | ------------------------- | ------------------------------------------------- |
| `pinoHttp`             | `app.ts`                  | Structured request/response logging               |
| `clerkProxyMiddleware` | `clerkProxyMiddleware.ts` | Forwards Clerk SDK requests through Express proxy |
| `cors`                 | `app.ts`                  | Allows cross-origin requests                      |
| `express.json()`       | `app.ts`                  | Parses JSON request bodies                        |
| `express.urlencoded()` | `app.ts`                  | Parses form data                                  |
| `clerkMiddleware`      | `app.ts`                  | Validates Clerk session tokens                    |

### 4.4 Controllers / Route Handlers

There are no separate controller files. Each route file in `src/routes/` defines and exports an Express `Router` with handlers inline.

Example pattern from `donations.ts`:

```ts
router.get("/donations/:id", async (req, res) => {
  // 1. Validate params with Zod
  const parsed = GetDonationParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  // 2. Query database
  const [donation] = await db
    .select()
    .from(donationsTable)
    .where(eq(donationsTable.id, parsed.data.id))
    .limit(1);

  // 3. Handle not found
  if (!donation) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  // 4. Enrich with related data (donor, claimedBy, OTP)
  const enriched = await enrichDonation(donation);

  // 5. Respond
  res.json(enriched);
});
```

### 4.5 Services

No explicit service layer exists. Helper functions like `enrichDonation()`, `getUser()`, and `getDonorUser()` are defined in the same route files and reused within those files.

### 4.6 Models

No explicit model classes. Drizzle ORM provides type-safe query builders directly from the schema definitions in `lib/db`.

### 4.7 Utilities

| Utility            | File            | Purpose                                              |
| ------------------ | --------------- | ---------------------------------------------------- |
| `logger`           | `lib/logger.ts` | Pino singleton for structured logging                |
| `seed.ts`          | `lib/seed.ts`   | Seeds verification tables with initial data if empty |
| `reverseGeocode()` | `donate.tsx`    | Fetches address from lat/lng via Nominatim           |

### 4.8 Business Logic

**Donation Lifecycle**:

```
available → claimed → completed
```

- `available`: Donor creates listing. Visible on map and browse page.
- `claimed`: NGO clicks "Claim". A `claims` record is created with a 6-digit OTP. `donations.status` becomes `claimed`.
- `completed`: Donor (or system) enters the correct OTP. `claims.otpVerified` becomes `true`, `donations.status` becomes `completed`.

**Enrichment Logic**:
The `enrichDonation()` function in `donations.ts` fetches the donor's profile, the claimer's profile, and the latest claim's OTP. This enriched data is returned for every donation detail request.

### 4.9 Error Handling

Error handling is **ad-hoc per route**:

- Invalid params → 400 with `"Invalid id"` or Zod error
- Unauthorized → 401 with `"Unauthorized"`
- Forbidden → 403 with `"Admin access required"` or `"Profile not found"`
- Not found → 404 with `"Not found"`
- Server errors → caught by Express default error handler (no custom middleware)

There is **no centralized error handling middleware** and **no error response standardization**.

### 4.10 Security Measures

- **Auth**: Clerk handles OAuth, session management, CSRF protection
- **Input Validation**: Zod schemas for all request bodies and params
- **Ownership Checks**: Donors can only modify their own donations (except admins)
- **Role Guards**: Admin routes check `user.role === "admin"`
- **Proxy**: Clerk proxy enables custom domains without DNS/CNAME configuration

---

## 5. Database

### 5.1 Database Type

**PostgreSQL** via `pg` (node-postgres driver) + **Drizzle ORM**.

### 5.2 Schema Overview

```mermaid
erDiagram
    users ||--o{ donations : creates
    users ||--o{ claims : makes
    donations ||--o{ claims : has
    donations ||--o| users : claimedBy
```

### 5.3 Tables

#### `users` Table

| Column               | Type                | Constraints           | Description                                          |
| -------------------- | ------------------- | --------------------- | ---------------------------------------------------- |
| `id`                 | serial              | PK                    | Auto-increment internal ID                           |
| `clerkId`            | text                | NOT NULL, UNIQUE      | Clerk authentication ID                              |
| `role`               | role enum           | NOT NULL              | donor / ngo / volunteer / admin                      |
| `name`               | text                | NOT NULL              | Full name                                            |
| `phone`              | text                | NOT NULL              | Phone number                                         |
| `address`            | text                |                       | Street address                                       |
| `city`               | text                |                       | City name                                            |
| `lat`                | double              |                       | GPS latitude                                         |
| `lng`                | double              |                       | GPS longitude                                        |
| `donorCategory`      | donor_category enum |                       | restaurant / hotel / caterer / event_org / household |
| `licenseNumber`      | text                |                       | FSSAI license (for businesses)                       |
| `orgName`            | text                |                       | Organization name (NGOs)                             |
| `registrationNumber` | text                |                       | NGO registration number                              |
| `operatingRadiusKm`  | double              |                       | How far the NGO operates                             |
| `vehicleType`        | text                |                       | Volunteer vehicle type                               |
| `availabilityStatus` | text                |                       | Volunteer availability                               |
| `darpanId`           | text                |                       | Darpan NGO ID                                        |
| `createdAt`          | timestamp           | NOT NULL, DEFAULT NOW | Registration time                                    |

#### `donations` Table

| Column              | Type                 | Constraints                      | Description                                 |
| ------------------- | -------------------- | -------------------------------- | ------------------------------------------- |
| `id`                | serial               | PK                               | Auto-increment                              |
| `donorId`           | integer              | FK → users.id, ON DELETE CASCADE | Who created the donation                    |
| `foodName`          | text                 | NOT NULL                         | Name of the food                            |
| `foodType`          | food_type enum       | NOT NULL                         | veg / non_veg / both                        |
| `quantityPlates`    | integer              | NOT NULL                         | Number of plates                            |
| `estimatedServings` | integer              |                                  | Estimated people served                     |
| `preparedAt`        | timestamp            |                                  | When the food was prepared                  |
| `pickupDeadline`    | timestamp            | NOT NULL                         | Must be picked up by this time              |
| `description`       | text                 |                                  | Additional details                          |
| `imageUrl`          | text                 |                                  | Photo URL                                   |
| `address`           | text                 |                                  | Pickup address                              |
| `lat`               | double               |                                  | GPS latitude                                |
| `lng`               | double               |                                  | GPS longitude                               |
| `status`            | donation_status enum | NOT NULL, DEFAULT 'available'    | available / claimed / picked_up / completed |
| `claimedByUserId`   | integer              | FK → users.id                    | Who claimed it                              |
| `createdAt`         | timestamp            | NOT NULL, DEFAULT NOW            | Created time                                |
| `updatedAt`         | timestamp            | NOT NULL, DEFAULT NOW            | Last updated                                |

#### `claims` Table

| Column            | Type      | Constraints                          | Description           |
| ----------------- | --------- | ------------------------------------ | --------------------- |
| `id`              | serial    | PK                                   | Auto-increment        |
| `donationId`      | integer   | FK → donations.id, ON DELETE CASCADE | Which donation        |
| `claimedByUserId` | integer   | FK → users.id, ON DELETE CASCADE     | Who claimed           |
| `otp`             | text      | NOT NULL                             | 6-digit pickup code   |
| `otpVerified`     | boolean   | NOT NULL, DEFAULT false              | Has donor verified?   |
| `createdAt`       | timestamp | NOT NULL, DEFAULT NOW                | Claim time            |
| `completedAt`     | timestamp |                                      | When OTP was verified |

#### Verification Tables

| Table            | Purpose                                                 |
| ---------------- | ------------------------------------------------------- |
| `fssai_licenses` | Pre-populated registry of valid FSSAI business licenses |
| `darpan_ids`     | Pre-populated registry of valid Darpan NGO IDs          |
| `admin_codes`    | Single-use access codes for admin account creation      |

### 5.4 Relationships

- **users → donations**: One-to-many (a donor can create many donations)
- **users → claims**: One-to-many (an NGO can make many claims)
- **donations → claims**: One-to-many (a donation can have multiple claims over time, but only one active)
- **donations → users (claimedByUserId)**: Many-to-one (a donation is claimed by one user)

### 5.5 Constraints

- `users.clerkId` is UNIQUE — prevents duplicate profiles per Clerk account
- `fssai_licenses.licenseNumber` is UNIQUE
- `darpan_ids.darpanId` is UNIQUE
- `admin_codes.code` is UNIQUE
- Foreign keys use `ON DELETE CASCADE` for donations and claims

### 5.6 Indexes

**No explicit indexes are defined** in the Drizzle schema. The database relies on:

- Primary key indexes (automatic)
- UNIQUE constraint indexes (automatic)
- Foreign key indexes (automatic in PostgreSQL)

**Missing indexes** that would improve performance:

- `donations(donorId)` — heavily queried
- `donations(status)` — filtered in nearly every list query
- `donations(claimedByUserId)` — used for enrichment
- `claims(donationId)` — used for unclaim/verify
- `claims(claimedByUserId)` — used for "my claims"
- `users(clerkId)` — used on every authenticated request

### 5.7 ORM / Query System

**Drizzle ORM** with `drizzle-orm/node-postgres`:

```ts
import { drizzle } from "drizzle-orm/node-postgres";
export const db = drizzle(pool, { schema });
```

Queries are type-safe and SQL-like:

```ts
await db
  .select()
  .from(donationsTable)
  .where(and(eq(donationsTable.status, "available")))
  .orderBy(desc(donationsTable.createdAt))
  .limit(50);
```

### 5.8 Migration System

Migrations are managed by **Drizzle Kit**:

```bash
pnpm --filter @workspace/db run push    # Push schema changes to dev DB
```

Migration files are not tracked in the repository. The `push` command applies schema changes directly.

### 5.9 Data Flow: Application ↔ Database

```
Frontend Request
  ↓
Express Route Handler
  ↓
Zod Validation (req.body/params)
  ↓
Drizzle Query Builder
  ↓
node-postgres Pool
  ↓
PostgreSQL Server
  ↓
Result Rows
  ↓
Drizzle Type Inference
  ↓
JSON Response
  ↓
React Query Cache
  ↓
Frontend UI
```

---

## 6. Authentication & Authorization

### 6.1 Login Flow

```
User clicks "Sign In"
  ↓
Clerk SignIn component renders (shadcn theme)
  ↓
User enters credentials or uses OAuth (Google, etc.)
  ↓
Clerk validates and creates session
  ↓
Session token stored in browser (httponly cookie)
  ↓
Frontend checks isSignedIn → true
  ↓
App.tsx checks for local profile via /api/users/me
  ↓
If no profile → redirect to /onboarding
  ↓
If profile exists → redirect to /dashboard
```

### 6.2 Registration Flow

```
User clicks "Sign Up"
  ↓
Clerk SignUp component renders
  ↓
User creates Clerk account
  ↓
User is redirected to /onboarding
  ↓
Step 1: Choose role (Donor / NGO / Volunteer / Admin)
  ↓
If Admin → enter admin code (verified against admin_codes table)
  ↓
If Donor → enter FSSAI license (verified against fssai_licenses table)
  ↓
If NGO → enter Darpan ID (verified against darpan_ids table)
  ↓
Step 2: Fill profile (name, phone, address, GPS, etc.)
  ↓
PUT /api/users/me → creates local profile
  ↓
Redirect to /dashboard
```

### 6.3 Session Handling

Clerk uses **HTTP-only cookies** for session management. The session token is automatically sent with every request. The `clerkMiddleware` in Express validates this token and populates `req.auth.userId`.

No JWT handling is done manually — Clerk abstracts all of it.

### 6.4 Roles and Permissions

| Role        | Permissions                                                                      |
| ----------- | -------------------------------------------------------------------------------- |
| `donor`     | Create donations, view own listings, view own stats, delete own donations        |
| `ngo`       | Browse/claim donations, view own claims, view NGO stats                          |
| `volunteer` | Same as NGO (distinct for future differentiation)                                |
| `admin`     | All donor/NGO permissions + delete any donation + manage verification registries |

Role checking happens in two places:

1. **UI**: `layout.tsx` conditionally shows nav links; pages conditionally show actions
2. **API**: Route handlers check `user.role` and return 403 if unauthorized

### 6.5 Password Storage

Passwords are **not stored in this application**. Clerk handles all credential storage using industry-standard hashing (bcrypt) and security practices.

### 6.6 Security Mechanisms

- **Clerk Proxy**: `/api/__clerk` routes all Clerk SDK calls through the Express server, enabling custom domains without DNS/CNAME configuration
- **Session Tokens**: Short-lived JWTs signed by Clerk's public key
- **CSRF Protection**: Clerk handles CSRF token validation automatically
- **Rate Limiting**: Not implemented
- **Input Sanitization**: Zod schemas validate all inputs

---

## 7. API Documentation

### 7.1 Complete Endpoint Reference

#### Health

| Method | URL            | Auth | Description         | File        |
| ------ | -------------- | ---- | ------------------- | ----------- |
| GET    | `/api/healthz` | None | Server health check | `health.ts` |

#### Users

| Method | URL             | Auth  | Request Body     | Response    | Description                | File       |
| ------ | --------------- | ----- | ---------------- | ----------- | -------------------------- | ---------- |
| GET    | `/api/users/me` | Clerk | —                | UserProfile | Get current user's profile | `users.ts` |
| PUT    | `/api/users/me` | Clerk | UserProfileInput | UserProfile | Create or update profile   | `users.ts` |

#### Donations

| Method | URL                  | Auth  | Request Body                           | Response    | Description                      | File           |
| ------ | -------------------- | ----- | -------------------------------------- | ----------- | -------------------------------- | -------------- |
| GET    | `/api/donations`     | None  | Query: status, foodType, limit, offset | Donation[]  | List donations with filters      | `donations.ts` |
| GET    | `/api/donations/my`  | Clerk | Query: status                          | Donation[]  | List current donor's donations   | `donations.ts` |
| GET    | `/api/donations/:id` | None  | —                                      | Donation    | Get single donation (enriched)   | `donations.ts` |
| POST   | `/api/donations`     | Clerk | DonationInput                          | Donation    | Create new donation              | `donations.ts` |
| PATCH  | `/api/donations/:id` | Clerk | DonationUpdate                         | Donation    | Update donation (owner only)     | `donations.ts` |
| DELETE | `/api/donations/:id` | Clerk | —                                      | { message } | Delete donation (owner or admin) | `donations.ts` |

#### Claims

| Method | URL                          | Auth  | Request Body   | Response    | Description                 | File        |
| ------ | ---------------------------- | ----- | -------------- | ----------- | --------------------------- | ----------- |
| POST   | `/api/donations/:id/claim`   | Clerk | —              | Claim       | Claim a donation (NGO only) | `claims.ts` |
| POST   | `/api/donations/:id/unclaim` | Clerk | —              | { message } | Unclaim a donation          | `claims.ts` |
| POST   | `/api/donations/:id/verify`  | Clerk | OtpVerifyInput | { success } | Verify OTP and complete     | `claims.ts` |
| GET    | `/api/claims/my`             | Clerk | —              | Claim[]     | List current user's claims  | `claims.ts` |

#### Stats

| Method | URL                   | Auth  | Response      | Description                     | File       |
| ------ | --------------------- | ----- | ------------- | ------------------------------- | ---------- |
| GET    | `/api/stats/donor`    | Clerk | DonorStats    | Donor's personal statistics     | `stats.ts` |
| GET    | `/api/stats/ngo`      | Clerk | NgoStats      | NGO's personal statistics       | `stats.ts` |
| GET    | `/api/stats/platform` | None  | PlatformStats | Public platform-wide statistics | `stats.ts` |

#### Verification

| Method | URL                      | Auth | Request Body      | Response                                       | Description              | File        |
| ------ | ------------------------ | ---- | ----------------- | ---------------------------------------------- | ------------------------ | ----------- |
| POST   | `/api/verify/fssai`      | None | { licenseNumber } | { valid, businessName, city, state, category } | Verify FSSAI license     | `verify.ts` |
| POST   | `/api/verify/darpan`     | None | { darpanId }      | { valid, orgName, city, state }                | Verify Darpan ID         | `verify.ts` |
| POST   | `/api/verify/admin-code` | None | { code }          | { valid }                                      | Verify admin access code | `verify.ts` |

#### Admin Registry

| Method | URL                              | Auth  | Request Body      | Response       | Description             | File                |
| ------ | -------------------------------- | ----- | ----------------- | -------------- | ----------------------- | ------------------- |
| GET    | `/api/admin/registry/fssai`      | Admin | —                 | FssaiLicense[] | List all FSSAI licenses | `admin-registry.ts` |
| POST   | `/api/admin/registry/fssai`      | Admin | FssaiLicenseInput | FssaiLicense   | Add FSSAI license       | `admin-registry.ts` |
| DELETE | `/api/admin/registry/fssai/:id`  | Admin | —                 | { message }    | Delete FSSAI license    | `admin-registry.ts` |
| GET    | `/api/admin/registry/darpan`     | Admin | —                 | DarpanId[]     | List all Darpan IDs     | `admin-registry.ts` |
| POST   | `/api/admin/registry/darpan`     | Admin | DarpanIdInput     | DarpanId       | Add Darpan ID           | `admin-registry.ts` |
| DELETE | `/api/admin/registry/darpan/:id` | Admin | —                 | { message }    | Delete Darpan ID        | `admin-registry.ts` |
| GET    | `/api/admin/registry/codes`      | Admin | —                 | AdminCode[]    | List admin codes        | `admin-registry.ts` |
| POST   | `/api/admin/registry/codes`      | Admin | AdminCodeInput    | AdminCode      | Add admin code          | `admin-registry.ts` |
| DELETE | `/api/admin/registry/codes/:id`  | Admin | —                 | { message }    | Delete admin code       | `admin-registry.ts` |

### 7.2 Request Lifecycle Example: Creating a Donation

```
Frontend (donate.tsx)
  → User fills form → clicks "List Donation"
  → react-hook-form validates with zod schema
  → useCreateDonation().mutate(formData)
  → Generated hook calls customFetch()
  → POST /api/donations

Backend (app.ts → donations.ts)
  → pinoHttp logs request
  → clerkMiddleware validates session token
  → getAuth(req) extracts clerkId
  → Query users table to find internal user ID
  → CreateDonationBody.safeParse(req.body)
  → Insert into donations table with donorId
  → Return JSON donation object

Frontend
  → onSuccess callback fires
  → toast("Donation listed!")
  → invalidateQueries() refreshes donation lists
  → redirect to /my-donations
```

---

## 8. Application Flow

### 8.1 Example: NGO Claims a Donation

```
1. NGO browses /donations
   - Frontend: useListDonations() fetches available donations
   - Backend: SELECT * FROM donations WHERE status = 'available'

2. NGO clicks "Claim" on donation #42
   - Frontend: useClaimDonation().mutate(42)
   - Backend:
     a. Verify user is authenticated
     b. Verify donation exists and status is 'available'
     c. Generate 6-digit OTP: Math.floor(100000 + Math.random() * 900000)
     d. INSERT INTO claims (donationId, claimedByUserId, otp)
     e. UPDATE donations SET status = 'claimed', claimedByUserId = user.id
     f. Return claim record with OTP

3. NGO sees donation in /my-claims
   - Frontend: useGetMyClaims() shows active claims

4. Donor opens donation #42 detail page
   - Frontend: useGetDonation(42)
   - Backend: enrichDonation() includes latest claim's OTP
   - Donor sees: "Claimed by: ABC NGO | OTP: 123456"

5. At physical pickup, Donor enters OTP
   - Frontend: useVerifyPickup().mutate({ id: 42, otp: "123456" })
   - Backend:
     a. Find claim record for donation #42
     b. Verify OTP matches
     c. UPDATE claims SET otpVerified = true
     d. UPDATE donations SET status = 'completed'
     e. Return success

6. Both dashboards update
   - Donor sees +N plates shared
   - NGO sees +N plates collected
```

### 8.2 Example: Auto-Cleanup of Expired Donations

```
Server boots
  ↓
cleanupExpiredDonations() runs immediately
  ↓
DELETE FROM donations
  WHERE pickupDeadline <= NOW()
    AND status != 'completed'
  RETURNING id
  ↓
Log: "Expired donations auto-removed: 3"
  ↓
setInterval(cleanupExpiredDonations, 300000) // every 5 minutes
```

---

## 9. Dependencies

### 9.1 Important Dependencies

| Package                           | Purpose              | Why It's Needed                                      |
| --------------------------------- | -------------------- | ---------------------------------------------------- |
| `react` / `react-dom`             | UI framework         | Core frontend library                                |
| `vite`                            | Build tool           | Fast dev server, HMR, production bundling            |
| `@tailwindcss/vite`               | Tailwind integration | Processes Tailwind v4 in Vite                        |
| `wouter`                          | Router               | Minimal footprint (~1.5KB), hooks-based API          |
| `@tanstack/react-query`           | Server state         | Caching, deduping, background refetching             |
| `react-hook-form`                 | Forms                | Performant form handling with minimal re-renders     |
| `zod`                             | Validation           | Runtime type checking and schema validation          |
| `@hookform/resolvers`             | Form + Zod bridge    | Connects react-hook-form to zod schemas              |
| `@clerk/react` / `@clerk/express` | Authentication       | OAuth, session management, user management           |
| `drizzle-orm` / `drizzle-zod`     | Database             | Type-safe SQL queries, schema-to-Zod conversion      |
| `pg`                              | PostgreSQL driver    | Node.js PostgreSQL client                            |
| `express`                         | HTTP server          | Web framework for API                                |
| `pino` / `pino-http`              | Logging              | Structured JSON logging with low overhead            |
| `esbuild`                         | Bundling             | Fast server-side bundling to ESM                     |
| `orval`                           | Codegen              | Generates React Query + Zod from OpenAPI             |
| `leaflet` / `react-leaflet`       | Maps                 | Free, open-source interactive maps                   |
| `lucide-react`                    | Icons                | Consistent, lightweight icon set                     |
| `framer-motion`                   | Animations           | Page transitions and micro-interactions              |
| `class-variance-authority`        | Component variants   | Type-safe Tailwind component variants                |
| `tailwind-merge` / `clsx`         | Class merging        | Handles conditional and conflicting Tailwind classes |
| `cors`                            | CORS headers         | Cross-origin resource sharing for API                |

### 9.2 Potentially Unused Dependencies

| Package                            | Status             | Notes                                                         |
| ---------------------------------- | ------------------ | ------------------------------------------------------------- |
| `framer-motion`                    | Possibly underused | Only a few animations; could be replaced with CSS transitions |
| *(none)*                           | —                  | —                                                             |

### 9.3 Suggested Alternatives

| Current   | Alternative     | Reason                                                  |
| --------- | --------------- | ------------------------------------------------------- |
| wouter    | React Router v7 | Better ecosystem, data routers, error boundaries        |
| pino-http | morgan (dev)    | Simpler for small projects; keep pino for production    |
| esbuild   | tsc + tsx       | Native TypeScript execution without bundling complexity |

---

## 10. Configuration

### 10.1 Environment Variables

| Variable                     | Required | Used By              | Description                   |
| ---------------------------- | -------- | -------------------- | ----------------------------- |
| `DATABASE_URL`               | Yes      | API Server, DB lib   | PostgreSQL connection string  |
| `PORT`                       | Yes      | API Server, Frontend | HTTP server port              |
| `BASE_PATH`                  | Yes      | Frontend             | URL path prefix (e.g., `/`)   |
| `CLERK_PUBLISHABLE_KEY`      | Yes      | API Server           | Clerk public key              |
| `CLERK_SECRET_KEY`           | Yes      | API Server           | Clerk secret key              |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes      | Frontend             | Vite-exposed Clerk public key |
| `VITE_CLERK_PROXY_URL`       | No       | Frontend             | Clerk proxy URL override      |
| `SESSION_SECRET`             | No       | —                    | Session encryption (optional) |
| `NODE_ENV`                   | Yes      | Build scripts        | `development` or `production` |

### 10.2 Config Files

| File                  | Purpose                                                                      |
| --------------------- | ---------------------------------------------------------------------------- |
| `pnpm-workspace.yaml` | Defines workspace packages, catalog versions, supply-chain security settings |
| `tsconfig.base.json`  | Shared strict TypeScript settings                                            |
| `tsconfig.json`       | Solution file for composite lib packages                                     |
| `vite.config.ts`      | Frontend build config: plugins, aliases, base path, dev server               |
| `build.mjs`           | Server bundling: esbuild with ESM output, pino plugin, sourcemaps            |
| `orval.config.ts`     | Codegen: output paths, client type (react-query), Zod generation             |

### 10.3 Build Configuration

**Frontend**:

- Vite dev server on `PORT` with `strictPort: true`
- Build outputs to `dist/public/`
- Aliases: `@` → `src/`, `@assets` → `attached_assets/`
- Tailwind CSS processed by `@tailwindcss/vite` plugin

**Backend**:

- esbuild bundles to `dist/index.mjs` (ESM format)
- Externalizes native modules, database drivers, etc.
- Pino worker files bundled separately via `esbuild-plugin-pino`
- Sourcemaps generated as linked files

### 10.4 Deployment Configuration

**Docker Deployment**:

- `docker-compose.yml` orchestrates PostgreSQL + API + nginx
- Frontend served as static files from `dist/public/`
- API server runs as background process
- nginx reverse proxy routes `/api/*` to the API server

---

## 11. Architecture Diagrams

### 11.1 Overall Architecture

```mermaid
graph TB
    subgraph "Client"
        Browser["Browser / Mobile"]
    end

    subgraph "Server"
        Proxy["Reverse Proxy"]

        subgraph "Frontend (sarthaksetu)"
            Vite["Vite Dev Server / Static Files"]
            React["React SPA"]
            Leaflet["Leaflet Map"]
            ClerkUI["Clerk UI Components"]
        end

        subgraph "Backend (api-server)"
            Express["Express 5 Server"]
            ClerkProxy["Clerk Proxy Middleware"]
            Routes["API Routes"]
            Pino["Pino Logger"]
        end

        subgraph "Generated Libraries"
            APIClient["api-client-react<br/>(React Query Hooks)"]
            APIZod["api-zod<br/>(Zod Schemas)"]
        end

        subgraph "Database"
            Postgres[("PostgreSQL")]
            Drizzle["Drizzle ORM"]
        end
    end

    subgraph "External Services"
        ClerkAPI["Clerk API"]
        Nominatim["Nominatim<br/>(OpenStreetMap Geocoding)"]
        OSMTiles["OpenStreetMap Tiles"]
    end

    Browser --> Proxy
    Proxy --> Vite
    Proxy --> Express
    Vite --> React
    React --> Leaflet
    React --> ClerkUI
    React --> APIClient
    APIClient --> Express
    Express --> ClerkProxy
    ClerkProxy --> ClerkAPI
    Express --> Routes
    Routes --> APIZod
    Routes --> Drizzle
    Drizzle --> Postgres
    Leaflet --> OSMTiles
    React --> Nominatim
    Pino --> Express
```

### 11.2 Frontend Architecture

```mermaid
graph TB
    App["App.tsx<br/>ClerkProvider + Router"]
    Layout["Layout.tsx<br/>Header + Nav"]

    subgraph "Pages"
        Home["home.tsx"]
        Onboarding["onboarding.tsx"]
        Dashboard["dashboard.tsx"]
        Donate["donate.tsx"]
        Donations["donations.tsx"]
        Detail["donation-detail.tsx"]
        Map["map.tsx"]
        MyDonations["my-donations.tsx"]
        MyClaims["my-claims.tsx"]
        Profile["profile.tsx"]
        Admin["admin-registry.tsx"]
    end

    subgraph "Data Layer"
        QueryClient["TanStack Query Client"]
        Hooks["Generated API Hooks"]
    end

    subgraph "UI Components"
        Shadcn["Shadcn UI Components"]
        Leaflet["react-leaflet"]
    end

    App --> Layout
    Layout --> Home
    Layout --> Onboarding
    Layout --> Dashboard
    Layout --> Donate
    Layout --> Donations
    Layout --> Detail
    Layout --> Map
    Layout --> MyDonations
    Layout --> MyClaims
    Layout --> Profile
    Layout --> Admin

    Donate --> Leaflet
    Map --> Leaflet
    Detail --> Shadcn
    Dashboard --> Shadcn
    AllPages --> QueryClient
    QueryClient --> Hooks
```

### 11.3 Backend Architecture

```mermaid
graph LR
    Request["HTTP Request"]
    App["app.ts<br/>Express App"]
    Router["routes/index.ts<br/>Router Aggregator"]

    subgraph "Middleware"
        Pino["pinoHttp<br/>Logging"]
        CORS["cors"]
        JSON["express.json()"]
        Clerk["clerkMiddleware<br/>Auth"]
    end

    subgraph "Route Modules"
        Health["health.ts"]
        Users["users.ts"]
        Donations["donations.ts"]
        Claims["claims.ts"]
        Stats["stats.ts"]
        Verify["verify.ts"]
        Admin["admin-registry.ts"]
    end

    subgraph "Database"
        Drizzle["Drizzle ORM"]
        Postgres[("PostgreSQL")]
    end

    Request --> Pino
    Pino --> CORS
    CORS --> JSON
    JSON --> Clerk
    Clerk --> App
    App --> Router
    Router --> Health
    Router --> Users
    Router --> Donations
    Router --> Claims
    Router --> Stats
    Router --> Verify
    Router --> Admin

    Users --> Drizzle
    Donations --> Drizzle
    Claims --> Drizzle
    Stats --> Drizzle
    Verify --> Drizzle
    Admin --> Drizzle
    Drizzle --> Postgres
```

### 11.4 Database Relationships

```mermaid
erDiagram
    users ||--o{ donations : "creates (donorId)"
    users ||--o{ claims : "makes (claimedByUserId)"
    donations ||--o{ claims : "has (donationId)"
    donations }o--|| users : "claimedBy (claimedByUserId)"

    users {
        serial id PK
        text clerkId UK
        roleEnum role
        text name
        text phone
        text address
        text city
        double lat
        double lng
        donorCategoryEnum donorCategory
        text licenseNumber
        text orgName
        text registrationNumber
        double operatingRadiusKm
        text vehicleType
        text availabilityStatus
        text darpanId
        timestamp createdAt
    }

    donations {
        serial id PK
        int donorId FK
        text foodName
        foodTypeEnum foodType
        int quantityPlates
        int estimatedServings
        timestamp preparedAt
        timestamp pickupDeadline
        text description
        text imageUrl
        text address
        double lat
        double lng
        donationStatusEnum status
        int claimedByUserId FK
        timestamp createdAt
        timestamp updatedAt
    }

    claims {
        serial id PK
        int donationId FK
        int claimedByUserId FK
        text otp
        boolean otpVerified
        timestamp createdAt
        timestamp completedAt
    }

    fssai_licenses {
        serial id PK
        text licenseNumber UK
        text businessName
        text city
        text state
        text category
        boolean isActive
        timestamp addedAt
    }

    darpan_ids {
        serial id PK
        text darpanId UK
        text orgName
        text city
        text state
        boolean isActive
        timestamp addedAt
    }

    admin_codes {
        serial id PK
        text code UK
        text label
        boolean isActive
        text usedByClerkId
        timestamp createdAt
    }
```

### 11.5 Request Flow: Claim a Donation

```mermaid
sequenceDiagram
    actor NGO as NGO User
    participant Browser as Browser
    participant FE as Frontend (React)
    participant API as API Server (Express)
    participant DB as PostgreSQL

    NGO->>Browser: Click "Claim" on donation
    Browser->>FE: onClick handler
    FE->>FE: useClaimDonation().mutate(id)
    FE->>API: POST /api/donations/42/claim
    API->>API: clerkMiddleware validates session
    API->>API: getAuth(req) → clerkId
    API->>DB: SELECT * FROM users WHERE clerkId = ?
    DB-->>API: user record
    API->>DB: SELECT * FROM donations WHERE id = 42
    DB-->>API: donation record
    API->>API: Generate OTP (6 digits)
    API->>DB: INSERT INTO claims (donationId, claimedByUserId, otp)
    API->>DB: UPDATE donations SET status='claimed', claimedByUserId=?
    API-->>FE: { id, donationId, claimedByUserId, otp, ... }
    FE->>FE: invalidateQueries() for donations
    FE->>Browser: Show "Claimed!" toast
    Browser-->>NGO: Success confirmation
```

### 11.6 Authentication Flow

```mermaid
sequenceDiagram
    actor User as User
    participant Browser as Browser
    participant ClerkUI as Clerk Components
    participant ClerkAPI as Clerk API
    participant FE as Frontend
    participant API as API Server
    participant DB as PostgreSQL

    User->>Browser: Click "Sign Up"
    Browser->>ClerkUI: Render SignUp component
    User->>ClerkUI: Enter credentials / OAuth
    ClerkUI->>ClerkAPI: Create account
    ClerkAPI-->>ClerkUI: Session token
    ClerkUI-->>Browser: Authenticated
    Browser->>FE: isSignedIn = true
    FE->>API: GET /api/users/me
    API->>DB: SELECT * FROM users WHERE clerkId = ?
    DB-->>API: No record (404)
    API-->>FE: 404
    FE->>Browser: Redirect to /onboarding
    User->>Browser: Fill onboarding form
    Browser->>FE: Submit profile
    FE->>API: PUT /api/users/me
    API->>DB: INSERT INTO users (...)
    DB-->>API: User record
    API-->>FE: User profile
    FE->>Browser: Redirect to /dashboard
```

### 11.7 Component Relationships

```mermaid
graph TB
    subgraph "Root"
        App["App.tsx"]
        QueryClient["QueryClientProvider"]
        ClerkProvider["ClerkProvider"]
    end

    subgraph "Layout"
        Layout["Layout.tsx"]
        Sheet["Sheet (mobile menu)"]
        NavLinks["Navigation Links"]
    end

    subgraph "Pages"
        Home["home.tsx<br/>Stats + Hero"]
        Onboarding["onboarding.tsx<br/>Multi-step wizard"]
        Dashboard["dashboard.tsx<br/>Role-based stats"]
        Donate["donate.tsx<br/>Form + Map"]
        Donations["donations.tsx<br/>Browse list"]
        Detail["donation-detail.tsx<br/>Claim/Verify/Delete"]
        MapView["map.tsx<br/>Markers + Route"]
        MyDonations["my-donations.tsx"]
        MyClaims["my-claims.tsx"]
        Profile["profile.tsx"]
        Admin["admin-registry.tsx"]
    end

    subgraph "Shared Hooks"
        useGetMyProfile["useGetMyProfile"]
        useListDonations["useListDonations"]
        useGetDonation["useGetDonation"]
        useCreateDonation["useCreateDonation"]
        useClaimDonation["useClaimDonation"]
        useVerifyPickup["useVerifyPickup"]
        useDeleteDonation["useDeleteDonation"]
    end

    App --> ClerkProvider
    ClerkProvider --> QueryClient
    QueryClient --> Layout
    Layout --> Sheet
    Sheet --> NavLinks
    Layout --> Home
    Layout --> Onboarding
    Layout --> Dashboard
    Layout --> Donate
    Layout --> Donations
    Layout --> Detail
    Layout --> MapView
    Layout --> MyDonations
    Layout --> MyClaims
    Layout --> Profile
    Layout --> Admin

    Home --> useGetMyProfile
    Dashboard --> useGetMyProfile
    Onboarding --> useGetMyProfile
    Donate --> useCreateDonation
    Donations --> useListDonations
    Detail --> useGetDonation
    Detail --> useClaimDonation
    Detail --> useVerifyPickup
    Detail --> useDeleteDonation
    MyDonations --> useListDonations
    MyClaims --> useGetMyClaims
```

---

## 12. Performance Analysis

### 12.1 Bottlenecks

1. **Stats endpoints load all rows into memory**:

   ```ts
   const allUsers = await db.select().from(usersTable);
   const allDonations = await db.select().from(donationsTable);
   ```

   `stats/platform` fetches every user and every donation. At scale, this will OOM the server.

2. **Enrichment N+1 queries**:
   `enrichDonation()` runs a separate query for the donor and another for the claimer per donation. For a list of 50 donations, this is 100 extra queries.

3. **No database indexes on foreign keys**:
   Queries like `WHERE donorId = ?` or `WHERE status = 'available'` perform full table scans.

4. **Image uploads not optimized**:
   Donation images are uploaded as base64 or direct URLs with no compression or CDN.

5. **Client-side filtering for stats**:
   ```ts
   const totalDonors = allUsers.filter((u) => u.role === "donor").length;
   ```
   This should be a SQL `COUNT(*) WHERE role = 'donor'`.

### 12.2 Expensive Operations

| Operation                            | Cost                 | Impact                         |
| ------------------------------------ | -------------------- | ------------------------------ |
| `GET /api/stats/platform`            | O(users + donations) | High — loads entire tables     |
| `GET /api/donations` with enrichment | O(N \* 2 queries)    | Medium — N+1 per item          |
| `GET /api/stats/donor`               | O(donor's donations) | Low-Moderate                   |
| Reverse geocoding                    | External API call    | Medium — Nominatim rate limits |

### 12.3 Memory Usage

- No explicit memory limits set
- Node.js default heap (~1.4GB on 64-bit)
- Image handling not optimized (no streaming)
- No memory leaks detected, but background interval holds references

### 12.4 Database Optimization

**Add these indexes**:

```sql
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_claimed_by ON donations(claimed_by_user_id);
CREATE INDEX idx_claims_donation_id ON claims(donation_id);
CREATE INDEX idx_claims_claimed_by ON claims(claimed_by_user_id);
CREATE INDEX idx_donations_pickup_deadline ON donations(pickup_deadline);
```

### 12.5 Caching Opportunities

1. **Platform stats** should be cached for 1-5 minutes (rarely change)
2. **Verification lookups** (FSSAI, Darpan) are static — cache indefinitely
3. **Donation lists** can be cached with short TTL (30 seconds) with cache invalidation on mutations
4. **User profiles** cached for the session duration

### 12.6 Scalability Improvements

1. **Move stats to materialized views** or aggregated columns
2. **Add pagination** to all list endpoints with cursor-based pagination
3. **Implement connection pooling** with `pg-pool` max connections
4. **Add a CDN** for static assets and images
5. **Separate image upload** to object storage (S3/R2) with signed URLs
6. **Implement rate limiting** to prevent abuse

---

## 13. Security Audit

### 13.1 Security Risks

| Risk                              | Severity   | Description                                                                                                                          |
| --------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| OTP stored in plaintext           | **High**   | The `otp` column in `claims` is plain text. Should be hashed with bcrypt if sensitive, or at minimum treated as a short-lived token. |
| No rate limiting                  | **High**   | No rate limiting on any endpoint. Brute force on OTP (6 digits = 1M combinations) or login attempts possible.                        |
| No input sanitization beyond Zod  | **Medium** | SQL injection is prevented by Drizzle parameterization, but XSS is possible if user content is rendered without escaping.            |
| Admin routes lack middleware      | **Medium** | Admin check is inline in each handler (`requireAdmin`). Easy to forget. Should be centralized middleware.                            |
| No HTTPS enforcement              | **Medium** | No `Strict-Transport-Security` header or HTTPS redirect. Use nginx or Caddy with SSL in production.                                  |
| Missing CORS origin restriction   | **Medium** | `cors({ credentials: true, origin: true })` allows any origin. Should restrict to known domains.                                     |
| Session tokens in logs            | **Low**    | pinoHttp logs request URLs but not headers. Safe by default.                                                                         |
| No Content Security Policy        | **Medium** | No CSP header set. Could allow XSS injection of scripts.                                                                             |
| Image URL validation              | **Low**    | `imageUrl` accepts any string. No URL validation or file type checking.                                                              |
| Admin delete without confirmation | **Low**    | No soft delete or confirmation step for admin deletion.                                                                              |

### 13.2 Input Validation

- ✅ All request bodies validated with Zod schemas
- ✅ All URL params parsed with Zod
- ⚠️ Query params sometimes use `as any` cast after Zod parse (type safety gap)
- ❌ No file upload validation (image URLs are just strings)

### 13.3 Authentication Weaknesses

- ✅ Clerk handles all auth securely
- ⚠️ No MFA/2FA enforcement
- ⚠️ No session timeout configuration visible
- ⚠️ No device/session management UI

### 13.4 Authorization Issues

- ⚠️ `PATCH /donations/:id` ownership check exists but could be bypassed if logic changes
- ⚠️ Admin check is copy-pasted in each admin route — easy to miss one
- ✅ Donors can only delete their own donations (with admin override)

### 13.5 OWASP Recommendations

| OWASP Category                 | Status     | Action                                               |
| ------------------------------ | ---------- | ---------------------------------------------------- |
| A01: Broken Access Control     | ⚠️ Partial | Centralize admin middleware                          |
| A02: Cryptographic Failures    | ⚠️ Partial | Hash OTPs if they persist                            |
| A03: Injection                 | ✅ Safe    | Drizzle parameterizes all queries                    |
| A04: Insecure Design           | ⚠️ Partial | Add rate limiting                                    |
| A05: Security Misconfiguration | ⚠️ Partial | Restrict CORS, add CSP                               |
| A06: Vulnerable Components     | ✅ Safe    | pnpm minimumReleaseAge protects against supply-chain |
| A07: Auth Failures             | ✅ Safe    | Clerk handles auth securely                          |
| A08: Data Integrity            | ✅ Safe    | Zod validates all inputs                             |
| A09: Logging Failures          | ✅ Safe    | pino structured logging                              |
| A10: SSRF                      | ✅ Safe    | No server-side request forging vectors               |

### 13.6 Suggested Fixes

1. **Hash OTPs**: Use bcrypt with low cost factor (OTP is short-lived)
2. **Rate limiting**: Add `express-rate-limit` with separate limits per endpoint
3. **Admin middleware**: Create `requireAdmin()` as Express middleware, not inline helper
4. **CSP header**: Add Helmet.js for security headers
5. **CORS restriction**: Set `origin` to specific domains in production
6. **Soft deletes**: Add `deletedAt` column instead of hard deletes
7. **Image validation**: Validate URL format and whitelist domains

---

## 14. Code Quality Review

### 14.1 Code Smells

1. **Duplicated helper functions**: `getUser()` is redefined in `claims.ts`, `stats.ts`, and `donations.ts`
2. **Magic numbers**: `5 * 60 * 1000` for cleanup interval, `100000` / `900000` for OTP generation
3. **Deep nesting**: Some route handlers have 4+ levels of nested conditionals
4. **Mixed concerns**: Route handlers do validation, auth, DB queries, and response formatting
5. **`as any` casts**: `eq(donationsTable.status, params.status as any)` — undermines type safety

### 14.2 Duplicate Code

```ts
// Appears in claims.ts, donations.ts, stats.ts
async function getUser(clerkId: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId))
    .limit(1);
  return user ?? null;
}
```

**Fix**: Move to `lib/db/src/queries.ts` or create a shared helpers package.

### 14.3 Refactoring Opportunities

1. **Extract service layer**: Create `src/services/donations.ts`, `src/services/claims.ts` with pure business logic
2. **Extract repository layer**: Create `src/repositories/users.ts`, `src/repositories/donations.ts` for DB queries
3. **Centralize admin middleware**: Replace inline `requireAdmin()` with Express middleware
4. **Standardize error responses**: Create `AppError` class with status codes and messages
5. **Add request validation middleware**: Parse and validate params before route handlers

### 14.4 Naming Improvements

| Current                   | Better                   | Reason                            |
| ------------------------- | ------------------------ | --------------------------------- |
| `getUser`                 | `findUserByClerkId`      | More descriptive                  |
| `enrichDonation`          | `loadDonationRelations`  | Clearer intent                    |
| `handleClaim`             | `claimDonationHandler`   | Follows handler naming convention |
| `cleanupExpiredDonations` | `deleteExpiredDonations` | More direct                       |

### 14.5 SOLID Principles

| Principle                 | Status      | Notes                                                               |
| ------------------------- | ----------- | ------------------------------------------------------------------- |
| **Single Responsibility** | ❌ Violated | Route handlers do too much (auth, validation, DB, response)         |
| **Open/Closed**           | ⚠️ Partial  | Adding new donation status requires changes in multiple files       |
| **Liskov Substitution**   | ✅ N/A      | No inheritance hierarchy                                            |
| **Interface Segregation** | ✅ OK       | Zod schemas are granular                                            |
| **Dependency Inversion**  | ⚠️ Partial  | Route handlers depend directly on Drizzle instead of an abstraction |

### 14.6 Maintainability Score

| Aspect        | Score      | Notes                                                     |
| ------------- | ---------- | --------------------------------------------------------- |
| Type Safety   | 8/10       | Mostly typed, some `any` casts                            |
| Test Coverage | 0/10       | No tests exist                                            |
| Documentation | 6/10       | README.md covers basics, inline docs minimal              |
| Consistency   | 7/10       | Some patterns repeated, some inconsistent                 |
| Modularity    | 5/10       | No service/repository layers                              |
| **Overall**   | **5.5/10** | Functional but needs architectural improvements for scale |

---

## 15. Deployment Guide

### 15.1 Running Locally

**Prerequisites**:

- Node.js 24+
- pnpm 9+
- PostgreSQL database
- Clerk account with publishable + secret keys

**Setup**:

```bash
# Install dependencies
pnpm install

# Set environment variables
export DATABASE_URL="postgres://user:pass@localhost:5432/sarthaksetu"
export CLERK_PUBLISHABLE_KEY="pk_test_..."
export CLERK_SECRET_KEY="sk_test_..."
export VITE_CLERK_PUBLISHABLE_KEY="pk_test_..."

# Push database schema
pnpm --filter @workspace/db run push

# Generate API clients (from OpenAPI spec)
pnpm --filter @workspace/api-spec run codegen

# Run full typecheck
pnpm run typecheck

# Start API server (in one terminal)
export PORT=8080
pnpm --filter @workspace/api-server run dev

# Start frontend (in another terminal)
export PORT=21683
export BASE_PATH="/"
pnpm --filter @workspace/sarthaksetu run dev
```

### 15.2 Deploying with Docker

The project includes a complete Docker Compose stack:

1. `docker-compose.yml` orchestrates PostgreSQL + API + nginx
2. Environment variables are set in `.env`:
   - `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`
3. nginx routes `/api/*` to the API server and everything else to the frontend
4. Run `docker compose up --build` to start the stack

### 15.3 Hosting on a VPS (e.g., DigitalOcean, AWS EC2)

```bash
# 1. Clone repository
git clone <repo-url> && cd workspace

# 2. Install pnpm
npm install -g pnpm

# 3. Install dependencies
pnpm install --frozen-lockfile

# 4. Build server
pnpm --filter @workspace/api-server run build

# 5. Build frontend
pnpm --filter @workspace/sarthaksetu run build

# 6. Set production environment
export NODE_ENV=production
export PORT=8080
export DATABASE_URL="<production-db-url>"
export CLERK_PUBLISHABLE_KEY="<live-key>"
export CLERK_SECRET_KEY="<live-secret>"

# 7. Start server
pnpm --filter @workspace/api-server run start

# 8. Serve frontend
# Option A: Serve dist/public/ with nginx
# Option B: Use the Express server to serve static files
```

**Nginx configuration**:

```nginx
server {
    listen 80;
    server_name sarthaksetu.org;

    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
    }

    location / {
        root /var/www/sarthaksetu/dist/public;
        try_files $uri $uri/ /index.html;
    }
}
```

### 15.4 Hosting on Android with Termux

```bash
# 1. Install Termux from F-Droid
# 2. Install dependencies
pkg update
pkg install nodejs postgresql pnpm git

# 3. Start PostgreSQL
pg_ctl -D $PREFIX/var/lib/postgresql start

# 4. Clone and setup
git clone <repo-url> && cd workspace
pnpm install

# 5. Build both
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/sarthaksetu run build

# 6. Start server
export PORT=8080
export DATABASE_URL="postgres://localhost:5432/sarthaksetu"
node artifacts/api-server/dist/index.mjs

# 7. Serve frontend (in another session)
cd artifacts/sarthaksetu/dist/public
npx serve -p 3000
```

### 15.5 Docker Deployment

**Dockerfile**:

```dockerfile
# Multi-stage build
FROM node:24-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-workspace.yaml package.json tsconfig*.json ./
COPY lib/ ./lib/
COPY artifacts/ ./artifacts/
RUN pnpm install --frozen-lockfile
RUN pnpm run typecheck
RUN pnpm --filter @workspace/api-server run build
RUN pnpm --filter @workspace/sarthaksetu run build

FROM node:24-slim AS runner
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/artifacts/api-server/dist ./api-server/dist
COPY --from=builder /app/artifacts/sarthaksetu/dist/public ./frontend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
CMD ["node", "api-server/dist/index.mjs"]
```

```bash
docker build -t sarthaksetu .
docker run -p 8080:8080 \
  -e DATABASE_URL=... \
  -e CLERK_PUBLISHABLE_KEY=... \
  -e CLERK_SECRET_KEY=... \
  sarthaksetu
```

### 15.6 Production Best Practices

1. **Use live Clerk keys** — development keys have strict limits
2. **Enable HTTPS** — Use Let's Encrypt with nginx or Caddy for SSL termination
3. **Set up a reverse proxy** — nginx or Caddy for load balancing and SSL
4. **Use a process manager** — PM2 or systemd to keep the server running
5. **Monitor logs** — pino logs are JSON; use a log aggregator
6. **Database backups** — Schedule daily pg_dump backups
7. **Rate limiting** — Add `express-rate-limit` before production
8. **Health checks** — The `/api/healthz` endpoint is ready for monitoring
9. **Environment isolation** — Separate dev/staging/prod databases and Clerk instances
10. **Image optimization** — Use a CDN or object storage for uploaded images

---

## 16. Future Improvements

### 16.1 Missing Features

| Feature                    | Priority | Description                                        |
| -------------------------- | -------- | -------------------------------------------------- |
| **Push Notifications**     | High     | Notify NGOs when new donations are nearby          |
| **Real-time Updates**      | High     | WebSocket or SSE for donation status changes       |
| **Donor Rating System**    | Medium   | NGOs rate donors, donors rate NGOs                 |
| **Photo Upload**           | Medium   | Direct image upload to S3/R2 instead of URLs       |
| **Multi-language Support** | Medium   | Hindi, regional languages                          |
| **SMS Notifications**      | Medium   | Send OTP and status updates via SMS                |
| **Volunteer Matching**     | Medium   | Match volunteers to nearby donations automatically |
| **Donation Scheduling**    | Low      | Schedule recurring donations (daily/weekly)        |
| **Analytics Dashboard**    | Low      | Charts and graphs for admins                       |
| **Mobile App**             | Low      | React Native or PWA version                        |

### 16.2 Scalability Roadmap

1. **Phase 1 (Current)**: Single server, single DB — handles ~100 concurrent users
2. **Phase 2**: Add read replicas for stats queries, implement Redis caching
3. **Phase 3**: Move image handling to CDN, add horizontal scaling with load balancer
4. **Phase 4**: Microservices split (auth service, donation service, notification service)

### 16.3 Performance Roadmap

1. Add database indexes (immediate)
2. Implement materialized views for stats (week 1)
3. Add Redis caching layer (week 2)
4. Implement cursor-based pagination (week 3)
5. Add connection pooling limits (week 4)

### 16.4 Security Roadmap

1. Add rate limiting (immediate)
2. Centralize admin middleware (immediate)
3. Add CSP and security headers (week 1)
4. Implement OTP hashing (week 2)
5. Add audit logging for admin actions (week 3)
6. Penetration testing (month 2)

### 16.5 Architecture Improvements

1. **Service Layer**: Extract business logic from route handlers into `src/services/`
2. **Repository Pattern**: Create `src/repositories/` for all DB queries
3. **Event Bus**: Use an event emitter for decoupled operations (e.g., send notification on claim)
4. **API Versioning**: Add `/api/v1/` prefix for future breaking changes
5. **GraphQL Option**: Consider GraphQL for flexible client queries

---

## 17. README

### SarthakSetu (सार्थकसेतु)

> A food donation platform connecting surplus food donors with NGOs and volunteers to reduce food waste in India.

### Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
# See .env.example for required variables

# Push database schema
pnpm --filter @workspace/db run push

# Generate API clients from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Run development servers
pnpm --filter @workspace/api-server run dev    # API on port 8080
pnpm --filter @workspace/sarthaksetu run dev       # Frontend on port 21683
```

### Project Structure

This is a **pnpm monorepo** with shared libraries and deployable artifacts:

- `artifacts/sarthaksetu/` — React + Vite frontend
- `artifacts/api-server/` — Express 5 backend
- `lib/api-spec/` — OpenAPI spec (single source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas
- `lib/db/` — Drizzle ORM schema and database client

### Technology Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS v4, wouter, TanStack Query
- **Backend**: Express 5, Drizzle ORM, PostgreSQL, pino
- **Auth**: Clerk (OAuth, SSO)
- **Maps**: Leaflet + OpenStreetMap
- **Validation**: Zod
- **Codegen**: Orval

### Available Scripts

```bash
pnpm run typecheck          # Full TypeScript check across all packages
pnpm run build              # Typecheck + build all packages
pnpm --filter @workspace/api-spec run codegen   # Regenerate API clients
pnpm --filter @workspace/db run push            # Push DB schema changes
pnpm --filter @workspace/api-server run dev     # Run API server
pnpm --filter @workspace/sarthaksetu run dev        # Run frontend
```

### Architecture

**Contract-First Design**: The OpenAPI spec (`lib/api-spec/openapi.yaml`) is the single source of truth. Orval generates:

- React Query hooks for the frontend (`lib/api-client-react`)
- Zod schemas for the backend (`lib/api-zod`)

This ensures the frontend and backend never drift out of sync.

### Environment Variables

| Variable                     | Required | Description                  |
| ---------------------------- | -------- | ---------------------------- |
| `DATABASE_URL`               | Yes      | PostgreSQL connection string |
| `CLERK_PUBLISHABLE_KEY`      | Yes      | Clerk public key             |
| `CLERK_SECRET_KEY`           | Yes      | Clerk secret key             |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes      | Frontend Clerk key           |
| `PORT`                       | Yes      | Server port                  |
| `BASE_PATH`                  | Yes      | URL base path                |

### Key Features

- **Role-based onboarding**: Donors (with FSSAI verification), NGOs (with Darpan ID), Volunteers, Admins
- **Food donation listings**: Create with GPS location, photo, quantity, and pickup deadline
- **Interactive map**: Color-coded markers (green=household, yellow=restaurant, orange=caterer, red=urgent)
- **Claim system**: NGO claims → 6-digit OTP generated → donor verifies at pickup → donation completed
- **Dashboards**: Role-specific stats for donors, NGOs, and public platform metrics
- **Admin panel**: Manage verification registries (FSSAI, Darpan, admin codes)

### Authentication

Clerk handles all authentication via OAuth and SSO. The app uses a **proxy pattern** where Clerk SDK calls route through `/api/__clerk` to enable custom domains without DNS/CNAME configuration.

### Database

PostgreSQL with Drizzle ORM. Schema managed in `lib/db/src/schema/`. Run migrations with:

```bash
pnpm --filter @workspace/db run push
```

### Deployment

**Docker** (recommended):

1. Copy `.env.production.example` to `.env` and fill in values
2. Run `docker compose up --build`

**VPS/Docker**:
See [Deployment Guide](#15-deployment-guide) for nginx, Docker, and VPS instructions.

### Troubleshooting

| Issue                         | Solution                                                |
| ----------------------------- | ------------------------------------------------------- |
| `PORT not provided`           | Set `PORT` env var before running                       |
| `Database connection failed`  | Check `DATABASE_URL` is correct and DB is running       |
| `Clerk auth not working`      | Verify `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`   |
| `Generated imports broken`    | Run `pnpm --filter @workspace/api-spec run codegen`     |
| `Type errors across packages` | Run `pnpm run typecheck:libs` then `pnpm run typecheck` |

### Contributing

1. All API changes must start in `lib/api-spec/openapi.yaml`
2. Run codegen after OpenAPI changes
3. Run full typecheck before committing: `pnpm run typecheck`
4. Follow existing code style (Prettier/ESLint not configured — add if desired)

### License

[Add your license here]

---

> **Document generated for SarthakSetu codebase analysis**
> **Stack**: React + Vite | Express 5 | PostgreSQL + Drizzle | Clerk | Leaflet | pnpm workspaces
> **Architecture**: Contract-first OpenAPI with Orval codegen
