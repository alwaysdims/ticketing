# Phase 4 Backend Integration Test Report

Status: PARTIAL VERIFICATION / LIVE MUTATION TESTS BLOCKED
Project: Event Registration & Barcode Check-in System
Repository: `E:/New_Project/frontend`
TEST Web App URL: user-provided Apps Script TEST URL
Production database: not accessed
Production secret: not accessed
Deployment: no new deployment performed
Git push: not performed

## 1. Scope and safety boundary

Phase 4 audit covered:

- `PRD.md`
- `design.md`
- `BACKEND_AUDIT.md`
- `PHASE3_INTEGRATION_REPORT.md`
- `apps-script/README.md`
- all local files under `apps-script/`
- all local files under `api/`
- `package.json`
- `vercel.json`

No Google Sheets credential, backend secret, Google account session, or production database value was requested or printed.

The provided Apps Script URL was read-only probed through `doGet` and security-negative POST requests. No registration, check-in, or write request was sent because TEST secret synchronization and explicit mutation authorization were not available in the session.

## 2. Current repository state

Local source includes:

```text
apps-script/
├── Code.gs
├── Config.gs
├── Security.gs
├── Registration.gs
├── Checkin.gs
├── Participants.gs
├── Tests.gs
├── appsscript.json
└── README.md
```

Local Vercel API includes:

```text
api/
├── register.js
├── admin/auth.js
├── admin/auth/google.js
├── admin/me.js
├── admin/stats.js
├── admin/participants.js
├── admin/checkin.js
├── admin/logout.js
└── _lib/*
```

No frontend UI or design file changed.

## 3. Manifest audit

Local `apps-script/appsscript.json`:

- JSON: PASS.
- Runtime: V8.
- Timezone: `Asia/Jakarta`.
- Web app execution: deploying user.
- Web app access: anonymous.
- Explicit OAuth scope: `https://www.googleapis.com/auth/spreadsheets`.
- Node.js dependencies: none.

Minimum scope assessment:

- Spreadsheet scope is required by `SpreadsheetApp.openById`, worksheet creation, reads, and writes.
- `Utilities`, `LockService`, `PropertiesService`, and `ContentService` do not require additional explicit scopes in this manifest.
- No external URL fetch is used by Apps Script source, so no `script.external_request` scope is required.

Remote manifest version is NOT VERIFIED. Apps Script `doGet` does not expose runtime, scopes, deployment version, or Script Properties. Apply the local manifest manually in Apps Script editor if remote project differs.

## 4. Remote deployment precheck

### PASS: deployment URL responds

Browser navigation to the user-provided URL followed the expected Apps Script redirect to a `script.googleusercontent.com` ContentService URL.

Observed `doGet` body:

```json
{"ok":true,"service":"Ticketing_Backend","status":"READY"}
```

This proves the URL is reachable and has a deployed `doGet` response. It does not prove the deployment runs current repository source.

### PASS: unsigned/incorrect request rejected

A POST with only `{"action":"stats"}` returned:

```json
{
  "ok": false,
  "requestId": "unknown",
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Format request tidak valid."
  }
}
```

### PASS: invalid HMAC rejected

A structurally valid envelope with an all-zero signature returned:

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Request tidak terotorisasi."
  }
}
```

### PASS: expired timestamp rejected

An envelope with timestamp older than the acceptance window returned:

```json
{
  "ok": false,
  "error": {
    "code": "EXPIRED_REQUEST",
    "message": "Request sudah kedaluwarsa."
  }
}
```

### BLOCKED: future timestamp definitive test

The first future-timestamp probe used a one-second offset while comparing clocks across local runtime and Google Apps Script. It returned `UNAUTHORIZED`, not a conclusive `EXPIRED_REQUEST`. A larger future offset requires a valid TEST signing secret to distinguish timestamp rejection from signature rejection. No claim is made.

### NOT VERIFIED: deployment source version

Remote response behavior is compatible with the expected contract, but no deployment version ID or source hash was available. Local changes must still be manually compared with the Apps Script editor and redeployed only with explicit permission.

## 5. Local Apps Script source audit

### HMAC and request boundary

- Envelope requires `timestamp`, `nonce`, `payloadText`, and `signature`.
- Signature input is `timestamp + '.' + nonce + '.' + payloadText`.
- Signature is lowercase hexadecimal HMAC-SHA256.
- Payload is parsed only after HMAC verification and nonce claim.
- Unknown actions return `INVALID_REQUEST`.
- No unsigned fallback exists.

Result: PASS by source inspection. Remote deployment version remains unverified.

### Timestamp and nonce

- Acceptance window is 60 seconds.
- UUID v4 format is required.
- Nonces are recorded in `Replay_Nonces` under `LockService.getScriptLock()`.
- Replay storage is a worksheet, not `CacheService`.
- Entries older than 24 hours are removed under the same lock.
- Replay-store errors fail closed as `INTERNAL_ERROR`.

Result: PASS by source inspection; live replay test BLOCKED without TEST secret.

### Registration

- Validation occurs in Apps Script and Vercel.
- WhatsApp normalizes `08...` to `628...` as a string.
- Participant writes use text number format and display-value read-back.
- Email and WhatsApp duplicates are checked under script lock.
- Quota is checked under script lock.
- `clientRequestId` and request hash are stored.
- Same idempotency key with different data is rejected.
- Same idempotency key after success returns the original ticket.
- Ticket candidate is validated and checked for collision under lock.

Result: PASS by source inspection; TEST Sheets read-back BLOCKED.

### Check-in

- Ticket code format is validated with the full `NWDS-` prefix.
- Method allowlist is `SCAN` or `MANUAL`.
- Admin email is passed from verified Vercel session, not browser input.
- Full participant read, decision, mutation, and log append run under script lock.
- Duplicate use returns `ALREADY_USED`.
- Log failure returns `INTERNAL_ERROR` and attempts a reconciliation marker.

Result: PASS by source inspection; concurrent live test BLOCKED.

### Formula injection

- Name, email, admin email, and IP hash are guarded before Sheets writes.
- Formula-leading values are prefixed with apostrophe.
- Vercel validation rejects formula-leading participant input earlier.

Result: PASS by source inspection and local unit tests.

### Error handling and secrets

- Public error messages omit stack traces, secrets, spreadsheet ID, and row details.
- Apps Script logs only request ID and error code.
- Script Properties are required for spreadsheet ID and backend secret.
- Vercel configuration reads server environment only.

Result: PASS by source inspection.

## 6. Sheets schema required

The Apps Script source creates missing sheets with these headers. Existing sheets must be checked manually before any write test; automatic migration was not run.

### `Participants`

| Order | Header | Format |
|---:|---|---|
| 1 | `ticket_code` | Plain text; unique `NWDS-XXXX-XXXX` |
| 2 | `full_name` | Plain text; 3–70 chars |
| 3 | `email` | Plain text; lowercase |
| 4 | `whatsapp` | Plain text; canonical `628...` |
| 5 | `registered_at` | ISO 8601 text |
| 6 | `checkin_status` | `NOT_CHECKED_IN` or `CHECKED_IN` |
| 7 | `checked_in_at` | ISO 8601 text or empty |
| 8 | `client_request_id` | UUID v4 text |

### `Checkin_Log`

| Order | Header | Format |
|---:|---|---|
| 1 | `log_id` | UUID text |
| 2 | `ticket_code` | Plain text |
| 3 | `checked_at` | ISO 8601 text |
| 4 | `admin_email` | Plain text |
| 5 | `method` | `SCAN` or `MANUAL` |
| 6 | `result` | `SUCCESS`, `ALREADY_USED`, `INVALID`, or reconciliation result |
| 7 | `ip_address_hash` | Short SHA-256 hex text |

### `Replay_Nonces`

| Order | Header | Format |
|---:|---|---|
| 1 | `nonce` | UUID v4 text; unique within retention |
| 2 | `received_at` | Unix seconds |
| 3 | `expires_at` | Unix seconds |

### `Registration_Requests`

| Order | Header | Format |
|---:|---|---|
| 1 | `client_request_id` | UUID v4 text |
| 2 | `request_hash` | SHA-256 lowercase hex |
| 3 | `status` | `IN_PROGRESS` or `REGISTERED` |
| 4 | `ticket_code` | Plain text |
| 5 | `created_at` | ISO 8601 text |
| 6 | `full_name` | Plain text |

Required manual Sheets checks:

- Header order matches exactly.
- No production participant rows appear in TEST workbook.
- `whatsapp` column is formatted Plain text before live registration.
- No public sharing is enabled.
- `Replay_Nonces` and `Registration_Requests` are not exposed to participant-facing clients.
- Existing data does not use stale headers from an earlier schema.

## 7. Vercel environment audit

Required variables found in local code:

- `APPS_SCRIPT_URL`
- `BACKEND_SECRET_KEY`
- `GOOGLE_CLIENT_ID`
- `ADMIN_ALLOWLIST`
- `SESSION_SECRET`
- `QUOTA_CAPACITY`
- `EVENT_NAME`

Local code does not contain secret values. Runtime config logs missing variable names only at cold start; values are not logged.

Required verification in Vercel Preview remains BLOCKED because environment settings are not readable from this session. Do not paste secrets into chat.

Node compatibility:

- API uses Node built-in `crypto` and `fetch`.
- `api/package.json` sets ESM mode.
- Syntax checks pass.
- Root project has `package-lock.json`.
- `npm audit --omit=dev`: PASS, 0 vulnerabilities.

Routing issue observed:

```text
GET https://ticketing-in.vercel.app/api/admin/me → 404 NOT_FOUND
POST https://ticketing-in.vercel.app/api/register → 404 NOT_FOUND
```

This public URL currently does not expose the local API functions, or it points to an older deployment/project configuration. No deployment was made to fix it. Verify Vercel Project settings, deployment commit, `outputDirectory`, and API function inclusion before any live Vercel test.

## 8. Admin authentication audit

Local implementation:

- Google credential is sent server-to-server to Google's `tokeninfo` endpoint.
- `aud`, `email_verified`, `iss`, and expiry are checked.
- Email is lowercased and checked against `ADMIN_ALLOWLIST`.
- Session cookie is signed with `SESSION_SECRET`.
- Cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, path `/`, max age 8 hours.
- CSRF cookie is issued separately.
- Mutating admin routes require `X-Requested-With` and matching `X-CSRF-Token`.
- Admin routes call `requireAdmin` server-side.
- Logout clears both cookies.

Live Google login test: BLOCKED. No real Google account test consent was provided, and no credential was requested.

Security note: `tokeninfo` is network-dependent. Before production, review replacement with maintained local Google ID-token signature verification and key rotation handling.

## 9. Tests actually run

### PASS: local contract tests

```text
Total: 29 tests | PASS: 29 | FAIL: 0
```

### PASS: API syntax

All API JavaScript files passed `node --check`.

### PASS: manifest JSON

`apps-script/appsscript.json` parsed successfully.

### PASS: frontend build

```text
Build complete: dist/ and root runtime assets synced for GitHub Pages
```

### PASS: dependency audit

```text
npm audit --omit=dev
found 0 vulnerabilities
```

### BLOCKED: live mutation suite

The following were not run:

1. Valid HMAC.
2. Registration valid.
3. Duplicate registration.
4. Idempotency retry.
5. Participant read-back.
6. Check-in success.
7. Double check-in.
8. Invalid ticket through Vercel.
9. Concurrent check-in.
10. Google Sheets read-back.
11. Sheets failure handling.
12. Apps Script timeout behavior.

Reason: TEST `BACKEND_SECRET` was not available to the local harness, Vercel Preview environment could not be verified, and mutation authorization was not established. No secret was requested in chat.

### BLOCKED: Vercel HTTP integration

Public Vercel URL returned `404 NOT_FOUND` for API routes. The deployed Vercel revision is not verified against local commit `9162a00`.

## 10. Local fix made during Phase 4

Fixed local Apps Script check-in validation to require the complete ticket code:

```text
NWDS-XXXX-XXXX
```

The previous local expression stripped `NWDS-` before validation, which was inconsistent with the actual lookup value. This fix must be manually applied to the TEST Apps Script editor and deployed as a new version only after explicit approval.

Updated local manifest to declare the minimum Spreadsheet OAuth scope.

No remote Apps Script deployment was performed.

## 11. Required manual actions before live mutation test

1. In Apps Script TEST editor, compare every local file with deployed source.
2. Apply the local `Checkin.gs` validation fix.
3. Confirm `appsscript.json` runtime, timezone, Web App settings, and Spreadsheet scope.
4. Confirm `SPREADSHEET_ID` points only to `Ticketing_Database_TEST`.
5. Confirm TEST secret equality with Vercel Preview without exposing either value.
6. Save/deploy a new TEST version only with explicit approval.
7. Verify the resulting Web App deployment URL.
8. Verify Vercel Preview environment points to that TEST URL and TEST secret.
9. Verify Vercel deployment includes API files from the intended commit.
10. Run local harness with environment variables injected through the shell or secret manager, never through chat or committed files.
11. Read back `Participants`, `Checkin_Log`, `Replay_Nonces`, and `Registration_Requests` after each mutation.
12. Delete or quarantine all test participant data after evidence capture, without touching production.

## 12. Final status

| Area | Status |
|---|---|
| Local source audit | PASS |
| Manifest JSON | PASS |
| Manifest remote parity | BLOCKED |
| Apps Script URL reachability | PASS |
| Apps Script source version parity | BLOCKED |
| Invalid HMAC rejection | PASS |
| Expired timestamp rejection | PASS |
| Replay live test | BLOCKED |
| Valid HMAC | BLOCKED |
| Registration write | BLOCKED |
| Idempotency | BLOCKED |
| WhatsApp Sheets read-back | BLOCKED |
| Check-in write | BLOCKED |
| Double check-in | BLOCKED |
| Concurrent check-in | BLOCKED |
| Google Sheets TEST inspection | BLOCKED |
| Vercel API routing | FAIL / NOT DEPLOYED AT TARGET URL |
| Admin Google login | BLOCKED |
| Local unit tests | PASS, 29/29 |
| API syntax | PASS |
| Frontend build | PASS |
| Dependency audit | PASS |

No claim of full backend integration, deployment parity, or production readiness is made.
