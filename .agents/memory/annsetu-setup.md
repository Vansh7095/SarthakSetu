---
name: AnnSetu setup patterns
description: Non-obvious integration details for the AnnSetu food donation platform (Clerk proxy, leaflet, queryClient file)
---

## Clerk Proxy Path

Clerk is proxied through the Express API server at `/api/__clerk`. The `clerkProxyMiddleware` must be mounted BEFORE body parsers in `app.ts` since it streams raw bytes. The frontend's ClerkProvider receives `proxyUrl` pointing to this path.

**Why:** Replit's shared proxy doesn't route Clerk SDK calls natively; proxying through Express lets both dev and prod share the same auth setup.

## Missing queryClient file causes Vite to loop

If `src/lib/queryClient.ts` doesn't exist when Vite first loads, it caches the error and won't recover even after the file is created. **Always restart the Vite workflow** after creating a new file in `src/lib/` to clear the stale cache.

**How to apply:** If Vite keeps throwing "failed to resolve import ./lib/queryClient" after creating the file, restart the annsetu web workflow.

## react-leaflet setup (no API key)

Uses OpenStreetMap tiles (free) instead of Google Maps. Must fix the default icon bug:
```ts
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: ..., shadowUrl: ... });
```
Packages: `leaflet`, `react-leaflet`, `@types/leaflet` in devDependencies of `@workspace/annsetu`.

## OTP pickup verification

6-digit OTP is generated server-side (`Math.floor(100000 + Math.random() * 900000).toString()`) and stored in the `claims` table. No SMS integration — OTP is displayed in the claim response for NGO to communicate to donor out of band. Verification flips `claims.otp_verified = true` and sets `donations.status = 'completed'`.
