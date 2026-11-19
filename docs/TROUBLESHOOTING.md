# Troubleshooting log

Real problems found while building SiteReady NZ, how each was found, and how it was fixed.
Useful as evidence for Task 07 (troubleshooting and error handling).

## Problems found and fixed

| # | Problem | How it was found | Cause | Fix |
|---|---|---|---|---|
| 1 | The API would not compile (4 TypeScript errors) | Running `tsc` | Passport and our own code both declared `req.user` with different types, and `tsconfig` `rootDir` excluded `server.ts` | Declared our fields on `Express.User`; fixed `rootDir` |
| 2 | Server crashed on start when Google keys were missing | Starting the API with the example `.env` | `passport-google-oauth20` throws on an empty client ID | Register the Google strategy only when real keys exist, and log a warning |
| 3 | Gmail addresses would not link to Google accounts | Code review of the register route | `normalizeEmail()` removes dots from Gmail names, so the stored email differed from Google's | Removed it; the service lowercases and trims instead |
| 4 | Equipment kept showing "OK" after its expiry date | Design review of the status hook | Status was only calculated when a record was saved | Every response recalculates the status, and so does the browser, so cached offline data is never stale |
| 5 | A client could set `status` or `_id` when creating equipment | Reading the controller | The raw request body went straight to the database | A whitelist of writable fields in the service; a unit test proves it |
| 6 | Listing inspections answered 500 | API test, then the server log | An inspection includes only part of an equipment record (no expiry date), and the status calculation crashed on it | Skip the calculation for partial records |
| 7 | The "added" toast covered the Edit button of the last row | Browser test screenshot | The toast was bottom-right, on top of the right-aligned actions | Moved toasts to bottom-centre |
| 8 | Push notifications never worked in the first browser test | Debug script that printed the real error | Chrome does not allow push in incognito-style contexts, which the test helper used | Test with a normal browser profile (this was a test setup limit, not an app bug) |
| 9 | `npm run build` failed with "Unexpected token" in `package.json` | Build error message | PowerShell wrote the file with a hidden byte-order mark | Rewrote the file without it, and scanned the project for others |
| 10 | Repeated test runs started failing with 429 | Test output | The login limiter (20 attempts per 15 minutes) correctly blocked the test machine | Restart the API between large test runs; the limit stays |

## Security problems found in the first draft of the code

| Problem | Why it mattered | Fix |
|---|---|---|
| Push "endpoint" accepted any address | Server-side request forgery: the server could be aimed at internal systems | Only `https` addresses on real push services are accepted (unit-tested with lookalike hosts) |
| Managers could notify users in other businesses | Data and spam leak between workspaces | Every query is limited to the caller's workspace |
| The inspection list could be read for any user | One staff member could see a colleague's jobs | Staff may only ask for their own list (403 otherwise) |
| The phone decided wording and severity of checklist items | A tampered request could downgrade a critical item | The server keeps the original questions and takes only the answers from the phone |

## How to read the logs

The API writes two files in `backend/logs/` (ignored by git) and the same lines on screen:

| File | Contains |
|---|---|
| `combined.log` | Every request (`http`), expected problems such as wrong passwords (`warn`), and start-up messages (`info`) |
| `error.log` | Only real server faults (`error`), with the stack trace, the request address and the user id |

Each line is one JSON object with a time, a level and a message, so it can be searched.
Set `LOG_LEVEL=debug` in `backend/.env` for more detail.

Quick checks:

| Symptom | Look for |
|---|---|
| "Something went wrong" in the app | `error.log`: the newest line has the cause |
| Someone cannot sign in | `combined.log`: a `warn` line `401 POST /auth/login` |
| Google sign-in sends you back to login | `login?error=` in the address bar: `google_unavailable` (keys not set), `oauth_state_mismatch` (link expired), `oauth_failed` |
| No push notifications arrive | `GET /api/push/public-key` returns 503 (keys missing), or the person never pressed "Turn on reminders", or notifications are blocked in the browser |
| Changes made offline never appear | The "waiting to upload" card on the Inspections page shows what is pending, or why the server refused it |

## What each safety net does

| Where | Net | What the person sees |
|---|---|---|
| Any page crashes | `ErrorBoundary` | "Something went wrong" with a reload button, not a blank screen |
| Server fault | Global error handler | A generic message; the details go to the log only |
| Wrong input | Validation on the browser and again on the server | A message under the field |
| No signal | Offline banner, saved drafts, outbox | Work continues and uploads later |
| Session ends | 401 handling | Sent back to sign in, nothing half-saved |
| A background job fails | Scheduler `try/catch` | The server keeps running and tries again in 15 minutes |
