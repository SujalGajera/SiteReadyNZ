# Screenshot checklist for the final report

Save every picture in `docs/screenshots/` with the file name shown. The numbers 1 to 12 are the plan from your
design document (section 8). Rows 13 to 22 are extra evidence the rubric asks for (Task 03, 05, 07 and 08).

Tick the box when the file exists.

## Before you start (once)

1. Make sure MongoDB is running (the Windows service, or open MongoDB Compass and connect).
2. Terminal 1: `cd backend`, then `npm run dev`. Wait for "Connected to MongoDB successfully".
3. Terminal 2: `cd frontend`, then `npm run build`, then `npx vite preview --port 5173 --strictPort`.
   Use this production version for every browser screenshot. The service worker and offline mode only work here,
   not in `npm run dev`.
4. Open Chrome at `http://localhost:5173`. Use a normal window (not Incognito), because push notifications do not
   work in Incognito.
5. Create some test data so the screens are not empty:
   - Sign up as a **manager** (this makes your workspace).
   - **Staff** page: add one staff member, for example "Tane Walker".
   - **Equipment** page: click **Add equipment** and add three items with these expiry dates: one far in the
     future (shows Ready), one within the next 30 days (Due soon), one in the past (Expired).
   - For the fourth status, **Check overdue**, the form has no "last inspected" box, so use Postman: run
     **Auth > POST /auth/login** as your manager, then edit the body of **Equipment > POST /api/equipment** to add
     `"lastInspectedAt": "2026-09-01"` with an expiry date far in the future, and send it. The item now shows
     Check overdue in the app.
   - **Inspections** page: assign one inspection to the staff member.

Tip: use `Win + Shift + S` to take a screenshot, then save it into `docs/screenshots/`.

## The 12 planned screenshots

| # | File name | What to show | How |
|---|---|---|---|
| [ ] 1 | `01-setup-commands.png` | The commands that set up the frontend and backend | Open a terminal in an **empty scratch folder outside this project** (for example `C:\Temp\setup-demo`). Run `npm create vite@latest demo -- --template react-ts`, and in another folder `npm init -y` then `npm install express mongoose`. Screenshot the terminals. In the report say these are the setup commands re-run in a scratch folder, because the real project was created earlier. |
| [ ] 2 | `02-service-worker.png` | The service worker running | Chrome, press F12, **Application** tab, **Service workers**. It should say `sw.js` is "activated and is running". |
| [ ] 3 | `03-equipment-dashboard.png` | Equipment list with coloured status badges | Signed in as the manager, **Equipment** page, with all four statuses visible. |
| [ ] 4 | `04-add-equipment-validation.png` | The form showing errors | Click **Add equipment**, leave the name empty, click into and out of the fields (errors show on blur), then click Save. |
| [ ] 5 | `05-checklist-offline-banner.png` | A checklist with the amber offline banner | Sign in as the **staff** member. F12, **Network** tab, set "No throttling" to **Offline**. Open a checklist. The amber strip at the top says "You are offline". |
| [ ] 6 | `06-indexeddb.png` | Cached data in IndexedDB | F12, **Application**, **IndexedDB**, `siteready-db`. Click `inspections` (and `outbox` after submitting one offline). |
| [ ] 7 | `07-postman-post-equipment-201.png` | Postman creating equipment, status 201 | Import `docs/postman/SiteReady-NZ.postman_collection.json`. Run **Auth > POST /auth/register**, then **Equipment > POST /api/equipment**. Show the 201 and the **Test Results** tab. |
| [ ] 8 | `08-postman-get-inspections-jwt.png` | GET inspections with the token | Run **Inspections > GET /api/inspections**. Open the **Authorization** tab so the Bearer token is visible, and show the 200 answer. |
| [ ] 9 | `09-mongodb-inspection-document.png` | An inspection stored in the database | Open **MongoDB Compass**, connect to `mongodb://localhost:27017`, database `siteready_nz`, collection `inspections`. Expand one document. (Your design document says Atlas, but you use a local database, which the assignment allows. Say so in the report.) |
| [ ] 10 | `10-push-notification-received.png` | A notification arriving | Staff in Chrome: click **Turn on reminders** and allow. In Postman log in as the manager and run **Push notifications > POST /api/push/send** (set the `staffId` variable to the staff member's id, from **GET /api/staff**). Screenshot the Windows notification that pops up, and the Postman answer. |
| [ ] 11 | `11-unit-tests-passing.png` | Tests passing | `npm test` in `backend` (197 tests) and in `frontend` (258 tests). Screenshot both results, ideally with `npm run test:coverage` for the table. |
| [x] 12 | `debug-01-watchers.png` | Debugger with watchers | Already done. |

## Extra evidence the rubric asks for

| # | File name | What to show | How |
|---|---|---|---|
| [ ] 13 | `13-browser-cache-storage.png` | Browser cache usage (Task 03) | F12, **Application**, **Cache storage**. Open `api-cache` and the precache entry. Also **Storage** in the left list for the usage bar. |
| [ ] 14 | `14-google-oauth-setup.png` | Google OAuth configuration (Task 03 and 08) | Google Cloud Console, **APIs and Services**, **Credentials**, your OAuth client. Show the authorised redirect URI. **Hide or crop out the client secret.** Never put the secret in a report. |
| [ ] 15 | `15-google-sign-in-works.png` | Signing in with Google | Click **Continue with Google** on the login page and finish. Screenshot the signed-in app. This also proves the repository change in Phase 7 did not break Google sign-in. |
| [ ] 16 | `16-login-error-message.png` | Friendly error handling | Sign in with a wrong password. Show the red message. |
| [ ] 17 | `17-server-logs.png` | Logger evidence (Task 07) | After step 16, open `backend/logs/combined.log` in VS Code. Show the `warn` and `http` lines. |
| [ ] 18 | `18-postman-error-codes.png` | 400, 401, 403, 404, 409 | In Postman, send a request without a token (401), a staff token to a manager route (403), an unknown id (404), and a duplicate email (409). One screenshot each, or one collage. |
| [ ] 19 | `19-postman-delete-204.png` | DELETE answers 204 | **Equipment > DELETE /api/equipment/:id**. |
| [ ] 20 | `20-mobile-checklist.png` | Works on a 375px phone screen | F12, click the device toolbar icon, choose iPhone SE or set width 375. Open a checklist. |
| [ ] 21 | `21-manager-inspections.png` | Manager assigning an inspection | **Inspections** page and the Assign sheet. |
| [ ] 22 | `22-offline-sync-complete.png` | Offline then synced | Submit a checklist while Offline (it shows "waiting to upload"), switch back to **No throttling**, and screenshot the "uploaded" message. |

## Not covered yet

- **Database replication or scaling (bonus, up to 5 marks, optional).** Nothing has been set up. A free MongoDB
  Atlas cluster is a three-member replica set by default, so a screenshot of the cluster page would count. It is
  your decision whether to do it.
