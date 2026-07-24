---
name: SarthakSetu setup patterns
description: Non-obvious integration details for the SarthakSetu food donation platform (Clerk proxy, leaflet, queryClient file, zod imports, Orval naming)
---

## Clerk Proxy Path

Clerk is proxied through the Express API server at `/api/__clerk`. The `clerkProxyMiddleware` must be mounted BEFORE body parsers in `app.ts` since it streams raw bytes. The frontend's ClerkProvider receives `proxyUrl` pointing to this path.

**Why:** Replit's shared proxy doesn't route Clerk SDK calls natively; proxying through Express lets both dev and prod share the same auth setup.

## Missing queryClient file causes Vite to loop

If `src/lib/queryClient.ts` doesn't exist when Vite first loads, it caches the error and won't recover even after the file is created. **Always restart the Vite workflow** after creating a new file in `src/lib/` to clear the stale cache.

**How to apply:** If Vite keeps throwing "failed to resolve import ./lib/queryClient" after creating the file, restart the sarthaksetu web workflow.

## react-leaflet setup (no API key)

Uses OpenStreetMap tiles (free) instead of Google Maps. Must fix the default icon bug:

```ts
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: ..., shadowUrl: ... });
```

Packages: `leaflet`, `react-leaflet`, `@types/leaflet` in devDependencies of `@workspace/sarthaksetu`.

## OTP pickup verification

6-digit OTP is generated server-side (`Math.floor(100000 + Math.random() * 900000).toString()`) and stored in the `claims` table. No SMS integration — OTP is displayed in the claim response for NGO to communicate to donor out of band. Verification flips `claims.otp_verified = true` and sets `donations.status = 'completed'`.

## API server routes must import zod via @workspace/api-zod, not directly

esbuild (used to bundle api-server) cannot resolve `"zod"` or `"zod/v4"` as direct imports in route files — zod is not in the api-server's own `dependencies`. Always use Zod schemas from `@workspace/api-zod` (the generated schemas) for request body validation in route handlers.

**Why:** The api-server bundles everything with esbuild; `zod` is only declared as a dependency of `@workspace/api-zod`, not `@workspace/api-server`, so direct imports fail at build time.

**How to apply:** Import generated schemas like `import { VerifyFssaiBody } from "@workspace/api-zod"` instead of `import { z } from "zod"`.

## Orval schema naming: avoid collisions between component schemas and generated body schemas

Orval auto-generates Zod body schema names from operation IDs (e.g. operation `verifyFssai` → body schema `VerifyFssaiBody`). It also generates TypeScript interfaces from `components/schemas`. If you name a component schema the same name Orval would auto-generate for a body schema (e.g. naming a component `VerifyFssaiBody`), you get a duplicate export conflict between `generated/api.ts` (Zod const) and `generated/types/` (TS interface).

**Fix:** Name component schemas differently from what Orval would derive from the operation ID. Convention: use `FssaiVerifyRequest` as the component schema name while Orval generates `VerifyFssaiBody` for the Zod schema.

## Seeding the DB requires tsx from scripts package

Direct `node -e "require('pg')..."` fails — pg is not globally available. Use `scripts/node_modules/.bin/tsx <script-path>` to run TypeScript seed scripts against the database.

**How to apply:** `scripts/node_modules/.bin/tsx lib/db/src/seed-verifications.ts`

## Vite HMR fails after codegen clears generated files

After running `pnpm --filter @workspace/api-spec run codegen`, Vite's pre-transform cache holds stale references to the old `generated/api.ts` paths. Pages will fail to HMR until the frontend workflow is restarted.

**How to apply:** Always restart the `artifacts/sarthaksetu: web` workflow after running codegen.
