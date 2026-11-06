# Phase 4.2 Vercel Deployment & GitHub Actions Report

Status: LOCAL CONFIGURATION FIXED / REMOTE DEPLOYMENT NOT PERFORMED
Repository: `https://github.com/alwaysdims/ticketing`
Branch: `main`
Last local commit before this phase: `49cee41`
Production database: not accessed
Secrets: not added or printed

## 1. Root cause: Vercel invalid_function_runtime

`vercel.json` contained:

```json
"functions": {
  "api/*.js": { "runtime": "nodejs20.x" },
  "api/admin/*.js": { "runtime": "nodejs20.x" },
  "api/admin/auth/*.js": { "runtime": "nodejs20.x" }
}
```

Vercel rejected this deployment with:

```text
[invalid_function_runtime]
Function Runtimes must have a valid version, for example now-php@1.0.0.
```

The repository does not need a custom Function runtime declaration. Native JavaScript Functions under root `api/` use Vercel's built-in Node.js runtime. The invalid `functions.runtime` override was removed.

`api/package.json` remains:

```json
{"type":"module"}
```

This is compatible with the API source's ESM imports. It is not a Vercel runtime declaration.

## 2. Vercel configuration after fix

`vercel.json` now contains:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true
}
```

Security headers remain in `vercel.json`.

No `builds`, `routes`, or `rewrites` configuration was added.

Native Function detection uses the repository-root `api/` directory:

```text
api/register.js
api/admin/me.js
api/admin/auth/google.js
api/admin/stats.js
api/admin/participants.js
api/admin/checkin.js
api/admin/logout.js
```

Helper modules under `api/_lib/` are imported by handlers and are not public routes.

The static build writes only to `dist/`. It does not copy, move, or delete root `api/`.

## 3. GitHub Actions root cause

`.github/workflows/pages.yml` used:

- `actions/configure-pages@v5`
- `actions/upload-pages-artifact@v3`
- `actions/deploy-pages@v4`
- `pages: write`
- `id-token: write`
- `github-pages` environment

GitHub returned:

```text
Get Pages site failed.
Please verify that the repository has Pages enabled and configured to build using GitHub Actions.
```

GitHub Pages is no longer the hosting target. The workflow was revised into a CI-only workflow named `Build and test`.

Retained checks:

- `npm ci`
- `npm run build`
- `npm run verify:vercel`
- `node api/_lib/tests.js`
- API `node --check`
- `npm audit --omit=dev`

Removed:

- Pages permissions.
- Pages environment.
- `configure-pages`.
- Pages artifact upload.
- Pages deployment.

The workflow still runs on pushes and pull requests targeting `main`, plus manual dispatch. The filename remains `pages.yml` for minimal change; it is no longer a Pages deployment workflow.

## 4. Files changed

```text
vercel.json
.github/workflows/pages.yml
```

No frontend UI/UX source changed.

No Apps Script source changed.

No database code changed.

## 5. Local verification

### PASS: static build

```text
npm run build
Build complete: dist/ and root runtime assets synced for GitHub Pages
```

The build output still uses `dist/` for static files. The old console wording mentioning GitHub Pages is harmless but deployment target is now Vercel.

### PASS: Vercel layout check

```text
npm run verify:vercel
Vercel layout PASS: root api/ preserved, dist/ static output present
```

Checks:

- Root `api/register.js` exists.
- Root `api/admin/me.js` exists.
- `dist/index.html` exists.
- `dist/api/` does not exist.
- `framework` is explicit `null`.
- `outputDirectory` is `dist`.

### PASS: API unit tests

```text
Total: 29 tests | PASS: 29 | FAIL: 0
```

### PASS: API syntax

All API files passed `node --check`.

### PASS: dependency audit

```text
npm audit --omit=dev
found 0 vulnerabilities
```

### NOT RUN: Vercel CLI local build

The Vercel CLI was not available within the local command timeout. No remote deployment was attempted. Repository checks and native Node checks passed instead.

## 6. Required Vercel Project Settings

Set/check in Vercel Dashboard:

1. Repository: `alwaysdims/ticketing`.
2. Production branch: `main`.
3. Root Directory: directory containing `vercel.json`, `package.json`, and root `api/`.
4. Framework Preset: `Other` or no framework override.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Do not add a custom Function runtime in dashboard.
8. Deployment must use commit containing this fix.
9. Build logs must show root API Functions detected.
10. Configure TEST environment variables only in Preview/TEST scope:
    - `APPS_SCRIPT_URL`
    - `BACKEND_SECRET_KEY`
    - `GOOGLE_CLIENT_ID`
    - `ADMIN_ALLOWLIST`
    - `SESSION_SECRET`
    - `QUOTA_CAPACITY`
    - `EVENT_NAME`

Do not put secrets in `vercel.json`, GitHub Actions YAML, frontend files, or reports.

## 7. Safe Preview deployment procedure

No push or deployment was performed.

After explicit approval:

1. Review local commit and working tree.
2. Push the approved commit to `main`.
3. Wait for Vercel deployment using exact commit SHA.
4. Check deployment build log for absence of `invalid_function_runtime`.
5. Check Function list includes `/api/register` and `/api/admin/me`.
6. Run unauthenticated route probes:

```text
GET /api/admin/me
```

Expected: `401`, not `404`.

```text
POST /api/register
```

Use deliberately invalid JSON payload. Expected: `400`, not `404` and not a database write.

7. Confirm Preview environment points to Apps Script TEST and TEST-only secret.
8. Run live registration/check-in tests only after explicit mutation authorization.

Never use `Ticketing_Database_2026`.

## 8. Open blockers

- This fix is not pushed.
- Vercel Project Root Directory is not verified from Dashboard.
- Vercel connected repository/project is not verified from Dashboard.
- Vercel Preview environment variables are not verified.
- Apps Script TEST source parity remains unverified.
- Live registration/check-in tests remain blocked.
- GitHub Actions will no longer deploy a site; Vercel is the only intended host.
- No claim is made that public Vercel routes work until a new deployment includes this fix.
