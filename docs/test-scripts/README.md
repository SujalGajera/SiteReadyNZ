# Test scripts

Checks that were run against the live app while building it. They are plain Node scripts, not part of the app.

| Script | What it checks |
|---|---|
| `push-api.mjs` | Push API: keys, subscribing, permissions, workspace limits, unsafe-address defence (27 checks) |
| `push-e2e.mjs` | Real Chrome: allow notifications, real delivery through Google's push service, the reminder and the late alert, once-only delivery, turning off, blocked permission |
| `smoke.mjs` | Quick regression: submit a checklist, equipment status, sign-in and sign-out |
| `verify-fixes.mjs` | Real Chrome, 14 checks: one service worker registered by our own file, the manager's Delete button and its confirm dialog, finished history showing "Removed equipment", and the app opening offline |

Known issue: in `push-e2e.mjs` the check "manager received Inspection is overdue" passes only some of the time. It behaves
the same on older code, so it is a quirk of opening several new automated Chrome windows at once, not a bug in the app.
See the Phase 8 entry in `agents/CHANGELOG.md`.

The browser scripts sign in a lot. The API allows 20 sign-in attempts per 15 minutes, so restart the API between scripts.
They also leave throwaway `@example.com` accounts in the database, so clean those up afterwards (for example with
mongosh: `db.users.deleteMany({ email: /@example\.com$/ })`, which removes only those accounts).

## Running them

1. Start the API (`npm run dev` in `backend`) and the production build of the app on port 5173
   (`npm run build`, then `npx vite preview --port 5173` in `frontend`).
2. In an empty folder run `npm init -y` and then `npm install puppeteer-core`, and copy a script in.
3. Run it with `node push-api.mjs` (or the script you want).

The browser scripts expect Google Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`.
The API allows 20 sign-in attempts per 15 minutes, so restart the backend if you run many scripts in a row.
