# AnnSetu (अन्नसेतु)

AnnSetu is a food donation platform that connects surplus food donors (restaurants, hotels, caterers, households) with NGOs and volunteers to reduce food waste in India.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/annsetu run dev` — run the frontend (port 21683)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — Clerk auth keys

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifact: `artifacts/annsetu/`)
- API: Express 5 (artifact: `artifacts/api-server/`)
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (Replit-managed)
- Map: react-leaflet + OpenStreetMap
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — DB schema (users.ts, donations.ts, claims.ts)
- `artifacts/api-server/src/routes/` — Express route handlers (users, donations, claims, stats, health)
- `artifacts/annsetu/src/` — React frontend (pages/, components/, lib/)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas for server validation (do not edit)

## Architecture decisions

- Contract-first OpenAPI approach: spec → codegen → typed hooks (client) + Zod schemas (server)
- Clerk auth via proxy path `/api/__clerk` — clerkProxyMiddleware routes Clerk SDK calls through the Express server
- Leaflet/react-leaflet with OpenStreetMap tiles (free, no API key needed) for the interactive donation map
- Color-coded map markers: green=household, yellow=restaurant, orange=caterer/event_org, red=urgent
- 6-digit OTP pickup verification: generated server-side on claim, donor enters at pickup to complete
- Role-based access: donor (create donations), ngo/volunteer (browse + claim donations)

## Product

- **Donors** register with name, phone, address, GPS location, and category (restaurant/hotel/caterer/event_org/household)
- **NGOs/Volunteers** register with org name, registration number, operating radius
- **Food Donations**: donors list surplus food with food type, quantity, prep time, pickup deadline, image, and location
- **Claim System**: NGO clicks Claim → 6-digit OTP generated → at pickup, NGO enters OTP → status goes to Completed
- **Interactive Map**: color-coded markers showing available donations across India
- **Dashboards**: donors see total plates shared & recent donations; NGOs see claims & plates collected; platform stats shown publicly

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- After codegen, grep exact Zod schema names with `grep "^export " lib/api-zod/src/generated/api.ts` before writing routes
- Clerk dev keys are test-only — swap to live keys on publish
- The `@clerk/react/internal` `publishableKeyFromHost` is used in `App.tsx` for Clerk custom domain support

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
