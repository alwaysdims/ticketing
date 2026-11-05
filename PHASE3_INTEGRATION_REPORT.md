# Phase 3 Integration Report

Status: PREPARATION ONLY
Repository: `E:/New_Project/frontend`
Baseline commit: `bb974d1`
Production database: not touched
Public deployment: not performed
Git push: not performed

## 1. Initial audit

Read:

- `PRD.md` v2.0
- `design.md` v2.0
- `BACKEND_AUDIT.md`
- `api/`
- `package.json`
- `vercel.json`

Initial discrepancies found:

1. Apps Script source was absent locally, so the previous audit could not verify the remote implementation.
2. Vercel used the old `_timestamp` and `_signature` body contract.
3. The requested auth path `/api/admin/auth/google` was not present.
4. `callAppsScript` did not unwrap the Apps Script `{ ok, result }` response contract.
5. Registration generated no server-side ticket candidate.
6. The earlier CSRF control checked only a custom header and had no per-session token.
7. In-memory rate limiting remained best-effort per serverless instance.

## 2. Source added

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

The source is written for Apps Script V8 globals and Apps Script services. It does not import Node.js modules.

## 3. Final HMAC contract

Both sides now target this envelope:

```json
{
  "timestamp": 1793900000,
  "nonce": "uuid-v4",
  "payloadText": "{\"action\":\"stats\",\"data\":{}}",
  "signature": "hmac-sha256-hex"
}
```

Signature input:

```text
timestamp + "." + nonce + "." + payloadText
```

Properties:

- Unix seconds.
- UTF-8 input.
- Lowercase hexadecimal output.
- Exact `payloadText` is signed and sent.
- No unsigned fallback.
- Apps Script verifies before dispatching any action.

## 4. Apps Script preparation

Implemented in repository source:

- HMAC verification.
- Timestamp expiry and future timestamp rejection.
- UUID v4 nonce validation.
- Persistent `Replay_Nonces` worksheet.
- Replay claim under `LockService`.
- Replay retention target of 24 hours.
- Fail closed when replay storage cannot be written.
- `Participants`, `Checkin_Log`, `Replay_Nonces`, and `Registration_Requests` worksheet setup.
- Registration validation.
- WhatsApp normalization to `628...` string.
- Plain-text sheet writes and read-back verification.
- Formula injection guard.
- Vercel-generated ticket candidate validation and collision check.
- Durable registration idempotency record.
- Quota check under registration lock.
- Atomic check-in critical section.
- `SUCCESS`, `ALREADY_USED`, `INVALID`, `SERVER_BUSY`, and internal error mapping.
- Check-in audit log with session-derived admin email.
- Participant statistics and bounded participant query.

Important limitation: two worksheets are not an ACID transaction. If participant state changes but the check-in log write fails, the source returns an internal error and attempts a `LOG_WRITE_FAILED` reconciliation marker. Operator reconciliation is required. Automatic rollback is intentionally not performed.

## 5. Vercel preparation

Updated:

- `api/_lib/auth.js`
- `api/_lib/appsScript.js`
- `api/_lib/middleware.js`
- `api/_lib/tests.js`
- `api/register.js`
- `api/admin/auth.js`
- `api/admin/auth/google.js`
- `api/admin/stats.js`
- `api/admin/participants.js`
- `api/admin/checkin.js`
- `api/admin/logout.js`

Endpoint contract:

- `POST /api/register`
- `POST /api/admin/auth/google`
- `GET /api/admin/me`
- `GET /api/admin/stats`
- `GET /api/admin/participants`
- `POST /api/admin/checkin`
- `POST /api/admin/logout`

Security behavior:

- Browser remains same-origin only.
- Apps Script URL stays server-side.
- Backend secret stays server-side.
- Google token is verified server-side.
- Admin email comes from verified session for check-in.
- Session cookie is signed, `HttpOnly`, `Secure`, `SameSite=Lax`, and expiring.
- Auth issues a non-HttpOnly CSRF cookie for double-submit validation.
- Mutating admin routes require `X-Requested-With` and matching `X-CSRF-Token`.
- PII responses set `Cache-Control: no-store` through admin session middleware.
- Apps Script responses are required to be bounded JSON with `{ ok: true, result }`.

## 6. Environment variables

Vercel:

- `APPS_SCRIPT_URL`
- `BACKEND_SECRET_KEY`
- `GOOGLE_CLIENT_ID`
- `ADMIN_ALLOWLIST`
- `SESSION_SECRET`
- `QUOTA_CAPACITY`
- `EVENT_NAME`

Apps Script Script Properties:

- `SPREADSHEET_ID`
- `BACKEND_SECRET`
- `MAX_PARTICIPANTS`
- `APP_TIMEZONE`

Use separate TEST values. `BACKEND_SECRET_KEY` and `BACKEND_SECRET` share one value only between the matching TEST environments. Rotate any old secret that may have been exposed.

## 7. Tests actually run

### PASS: Node contract/unit tests

Command, with ephemeral process environment values:

```text
APPS_SCRIPT_URL=https://test.invalid/apps-script BACKEND_SECRET_KEY=ephemeral-test-secret GOOGLE_CLIENT_ID=test-client-id SESSION_SECRET=ephemeral-session-secret ADMIN_ALLOWLIST=admin@example.com node api/_lib/tests.js
```

Result:

```text
Total: 29 tests | PASS: 29 | FAIL: 0
```

Covered:

- Final four-field HMAC envelope.
- Valid signature.
- Tampered payload.
- Expired timestamp.
- Future timestamp.
- Invalid signature.
- Invalid nonce shape.
- Whitespace and Unicode payload binding.
- Session signature and expiry.
- Cookie parsing.
- WhatsApp text normalization.
- Email and name validation.
- Formula-injection rejection.
- Consent and UUID validation.
- Honeypot.
- Ticket format and method validation.

### PASS: JavaScript syntax

All files under `api/` passed `node --check`.

### PASS: existing frontend build

```text
npm run build
Build complete: dist/ and root runtime assets synced for GitHub Pages
```

### NOT RUN

These are not claimed as PASS:

- Apps Script editor execution.
- HTTP request to Apps Script TEST.
- `Ticketing_Database_TEST` read-back.
- Google ID token live verification.
- Unauthorized Google admin login.
- Nonce replay against deployed Apps Script.
- Two simultaneous check-in requests.
- Sheets write failure.
- Apps Script timeout.
- Redirect behavior from a real ContentService deployment.
- Vercel Preview or production smoke test.

No TEST deployment URL or safe TEST secret was available in this session.

## 8. Manual TEST deployment procedure

1. Create/open a separate Apps Script TEST project.
2. Copy each `.gs` file into the matching editor file.
3. Apply `appsscript.json` with V8 runtime.
4. Set Script Properties to `Ticketing_Database_TEST` and TEST-only secret.
5. Run `runLocalContractTests_`, `testWhatsAppText_`, and `testFormulaGuard_` manually.
6. Deploy as Web App TEST, executing as the deploying user, anonymous access enabled.
7. Put the TEST Web App URL and matching TEST secret into Vercel Preview environment variables.
8. Call `/api/register` with a valid UUID and privacy consent.
9. Verify `Participants` read-back, especially WhatsApp text and ticket code.
10. Retry with the same `clientRequestId` and a new HMAC nonce. Expect `ALREADY_PROCESSED`, not another row.
11. Call check-in twice. Expect `SUCCESS`, then `ALREADY_USED`.
12. Send two simultaneous check-in requests and inspect exactly one state mutation.
13. Test invalid signature, expired timestamp, future timestamp, reused nonce, invalid CSRF token, missing session, malformed upstream JSON, and timeout.
14. Record all results before any production consideration.

Do not use `Ticketing_Database_2026` in this procedure.

## 9. Remaining risks

- Apps Script source is prepared but not verified against the existing remote editor project.
- `CacheService` is not used as replay truth; the replay worksheet can add write and read overhead.
- Replay cleanup currently runs during requests and needs observation under event-day traffic.
- Google ContentService redirect behavior needs a live TEST smoke test.
- Vercel in-memory IP limits are not global. Use Vercel WAF or a shared rate-limit store before production.
- Google token verification currently uses Google's `tokeninfo` endpoint; production review should consider local signature verification with a pinned, maintained verifier.
- Error HTTP status from Apps Script ContentService is not authoritative because the wrapper returns JSON with status 200; Vercel maps the structured error code.
- Frontend is intentionally not integrated in Phase 3.
