# Test scripts

Checks that were run against the live app while building it. They are plain Node scripts, not part of the app.

| Script | What it checks |
|---|---|
| `push-api.mjs` | Push API: keys, subscribing, permissions, workspace limits, unsafe-address defence (27 checks) |
| `push-e2e.mjs` | Real Chrome: allow notifications, real delivery through Google's push service, the reminder and the late alert, once-only delivery, turning off, blocked permission |
| `smoke.mjs` | Quick regression: submit a checklist, equipment status, sign-in and sign-out |

## Running them

1. Start the API (`npm run dev` in `backend`) and the production build of the app on port 5173
   (`npm run build`, then `npx vite preview --port 5173` in `frontend`).
2. In an empty folder run `npm init -y` and then `npm install puppeteer-core`, and copy a script in.
3. Run it with `node push-api.mjs` (or the script you want).

The browser scripts expect Google Chrome at `C:\Program Files\Google\Chrome\Application\chrome.exe`.
The API allows 20 sign-in attempts per 15 minutes, so restart the backend if you run many scripts in a row.
