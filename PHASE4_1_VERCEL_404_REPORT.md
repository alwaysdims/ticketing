# Phase 4.1 Vercel API 404 Audit

Status: LOCAL FIX APPLIED / REMOTE DEPLOYMENT NOT PERFORMED
Repository: `E:/New_Project/frontend`

## Root cause evidence

Observed public responses:

```text
GET https://ticketing-in.vercel.app/api/admin/me → 404 NOT_FOUND
POST https://ticketing-in.vercel.app/api/register → 404 NOT_FOUND
```

Local repository evidence:

- Root `api/` exists.
- `api/register.js` exists.
- `api/admin/me.js` exists.
- Both files are tracked in `HEAD`.
- `HEAD` and `origin/main` point to `afb766e` during this audit.
- `vercel.json` exists at repository root.
- No `builds` legacy configuration exists.
- No `rewrites` or `routes` override captures `/api/*`.
- `scripts/build.js` removes/recreates only `dist/`, then writes static assets there and to selected root asset folders. It does not move or delete root `api/`.
- No `public/` directory exists.
- No `.vercelignore` exists.
- `.gitignore` excludes only `node_modules/` and `dist/`.

Conclusion: local build does not explain the API 404. Strongest explanation is remote Vercel Project configuration/deployment state: wrong Root Directory, wrong connected repository/branch, old deployment, or deployment created from a revision that did not contain `api/`. Exact remote cause cannot be proven without Vercel dashboard/deployment inspection.

## Local configuration fix

Changed `vercel.json`:

- Added `"framework": null` to prevent framework auto-detection from changing static output behavior.
- Kept `buildCommand: "npm run build"`.
- Kept `outputDirectory: "dist"`.
- Kept `cleanUrls: true`.
- Made Function patterns explicit for root and nested API files:
  - `api/*.js`
  - `api/admin/*.js`
  - `api/admin/auth/*.js`

Changed `package.json`:

- Added `npm run verify:vercel`.

Added:

```text
scripts/verify-vercel-layout.js
```

The check verifies:

- root API files exist;
- static output exists in `dist/`;
- API files are not copied into `dist/`;
- `vercel.json` uses expected build/output settings.

No UI, frontend route, or database code changed.

## Required Vercel project settings

In Vercel Project Settings, verify:

1. Repository: `alwaysdims/ticketing`.
2. Production branch: `main`.
3. Root Directory: repository root, not `frontend/`, `src/`, or another subdirectory. If Vercel project is already connected to a repository whose app lives in `frontend/`, set Root Directory to `frontend` instead and verify the deployed checkout contains `frontend/api/` and `frontend/vercel.json`.
4. Framework Preset: `Other`, or overridden by repository `"framework": null`.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. No legacy `builds` setting in dashboard or another configuration file.
8. No ignored `api/` path in Vercel Ignore Build Step or project ignore rules.
9. Deployment commit SHA includes `afb766e` or a later commit containing root `api/`.
10. Deployment file list/build logs show Functions for:
    - `/api/register`
    - `/api/admin/me`
    - `/api/admin/auth/google`
11. Preview/Production environment variables are configured separately. Do not copy production credentials into TEST.
12. `APPS_SCRIPT_URL` for TEST points to the user-provided TEST Web App URL.

`outputDirectory: dist` controls static files. It should not prevent Vercel from detecting root `api/` Functions when the project Root Directory is correct.

## Local verification

Commands to run after this change:

```text
npm run build
npm run verify:vercel
APPS_SCRIPT_URL=https://test.invalid/apps-script BACKEND_SECRET_KEY=ephemeral-test-secret GOOGLE_CLIENT_ID=test-client-id SESSION_SECRET=ephemeral-session-secret ADMIN_ALLOWLIST=admin@example.com node api/_lib/tests.js
for f in api/_lib/*.js api/*.js api/admin/*.js api/admin/auth/*.js; do node --check "$f" || exit 1; done
npm audit --omit=dev
```

Remote HTTP verification remains pending until a deployment containing this commit exists:

```text
GET  /api/admin/me             → expected 401 without session, not 404
POST /api/register             → expected validation response, not 404
POST /api/admin/auth/google   → expected credential validation response, not 404
```

Do not send valid registration data before TEST environment and mutation approval are confirmed.

## Safe push/deployment procedure

1. Review local diff and commit.
2. Push the approved commit to `main` only after explicit approval.
3. Wait for Vercel deployment associated with the exact commit SHA.
4. Inspect build logs for detected Functions and output directory.
5. Test `/api/admin/me` without cookies. Expected `401`, proving route exists.
6. Test `/api/register` with deliberately invalid payload. Expected `400`, proving route exists without writing data.
7. Verify Vercel environment variables target TEST only.
8. Run signed TEST integration suite only after confirming Apps Script source/version and TEST secret synchronization.
9. Never use `Ticketing_Database_2026`.

## Open risks

- Public Vercel deployment may use a different Vercel project or repository than `origin/main`.
- Public Vercel deployment may still use an older commit.
- Dashboard Root Directory can override repository expectations.
- `nodejs20.x` may require a Vercel-supported runtime update in future; current local config remains unchanged except explicit function patterns.
- No remote deployment or dashboard access was performed.
- API routes may become reachable after deployment but still fail runtime configuration if TEST environment variables are absent. Route existence and backend integration are separate acceptance checks.
