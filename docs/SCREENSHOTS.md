# Screenshot walkthrough: from the project folder to the end

Take the screenshots in this order. The order follows how you would explain the project: the project folder first,
then the database, the API, Postman, the app, Chrome DevTools, push, tests, debugging, and finally GitHub.

- Save each picture in `docs/screenshots/` with the file name shown. `debug-01-watchers.png` is already there.
- Windows: press `Win + Shift + S`, drag over the area, then paste into Paint and save, or save from the pop-up.
- Tick the box when the file exists.
- Every row says **Go to** (where to click or type) and **Must show** (what has to be visible in the picture).
- Never show a real secret: crop out the Google client secret, and show `.env.example`, not `.env`.

---

## Part 0. Get ready (not screenshots)

1. **MongoDB:** the Windows service is already running. You can check in the Start menu under Services (look for MongoDB).
2. **Terminal 1, API:** in VS Code open a terminal, then `cd backend` and `npm run dev`. Wait for the line
   `Connected to MongoDB successfully`.
3. **Terminal 2, app:** a second terminal, then `cd frontend`, `npm run build`, then `npx vite preview --port 5173 --strictPort`.
   Use this production copy for every app screenshot. Offline mode and the service worker only work here, not in `npm run dev`.
4. **Chrome:** open `http://localhost:5173` in a **normal** window (not Incognito, push does not work there).
5. **Demo data for the app screens:**
   1. In the app go to `http://localhost:5173/register` and create your manager (take screenshot 50 first).
   2. In Postman import `backend/src/postman/SiteReady-NZ-demo-data.postman_collection.json`, open it, choose **Variables**,
      type your email and password into `demoEmail` and `demoPassword`, and click **Save**.
   3. Run the collection. It adds a staff member, four equipment items (one per status) and two checks (one due today, one 3 days late).
   4. Refresh the app.

---

## Part 1. The project folder (VS Code)

| Done | File name | Go to | Must show |
|---|---|---|---|
| [ ] | `01-setup-commands.png` | A terminal in an **empty scratch folder outside this project** (for example `C:\Temp\setup-demo`). Run `npm create vite@latest demo -- --template react-ts`. In a second folder run `npm init -y` then `npm install express mongoose`. | Both commands and their output. In the report say these are the setup commands re-run in a scratch folder, because the real project was created earlier. |
| [ ] | `02-project-structure.png` | VS Code Explorer. Expand `backend/src` and `frontend/src` one level. | Folders `config`, `controllers`, `middleware`, `models`, `repositories`, `routes`, `services`, `tests`, `utils` on the backend, and `components`, `context`, `hooks`, `pages`, `services`, `sw`, `tests`, `utils` on the frontend. |
| [ ] | `03-backend-package-json.png` | Open `backend/package.json`. | The `scripts` block and the `dependencies` (express, mongoose, jsonwebtoken, bcryptjs, helmet, web-push, winston). |
| [ ] | `04-frontend-package-json.png` | Open `frontend/package.json`. | The `scripts` block and the `dependencies` (react, axios, idb, motion, workbox). |
| [ ] | `05-vite-config-pwa.png` | Open `frontend/vite.config.ts`. | The `VitePWA({...})` block with `strategies: 'injectManifest'` and the `manifest` (name, theme colour, icons, `display: 'standalone'`). |
| [ ] | `06-env-example-and-gitignore.png` | Open `backend/.env.example`, and in a split view `.gitignore`. | The list of settings with placeholder values (no real secrets) and the `.env` line in `.gitignore`. |
| [ ] | `07-service-worker-source.png` | Open `frontend/src/sw/sw.ts`. | The imports plus `precacheAndRoute`, `NetworkFirst`, and the `sync` and `push` listeners. |
| [ ] | `08-service-worker-registration.png` | Open `frontend/src/sw/registerServiceWorker.ts` and the `registerServiceWorker()` line in `frontend/src/main.tsx`. | The `registerSW({ immediate: true })` call and where it is started. |

## Part 2. The database (mongosh and Compass)

Open a terminal and type `mongosh "mongodb://localhost:27017/siteready_nz"`. The prompt changes to `siteready_nz>`.

| Done | File name | Go to | Must show |
|---|---|---|---|
| [ ] | `10-mongosh-collections.png` | In mongosh type: `show collections` then `db.users.countDocuments()` and `db.equipment.countDocuments()` | The four collections: equipment, users, inspections, pushsubscriptions, and the counts. |
| [ ] | `11-mongosh-equipment.png` | `db.equipment.find({}, { name: 1, type: 1, status: 1, expiryDate: 1 }).pretty()` | Equipment documents with their status. |
| [ ] | `12-mongosh-inspection-document.png` | `db.inspections.findOne({ status: 'completed' }, { status: 1, syncStatus: 1, submissionId: 1, completedAt: 1, items: { $slice: 2 } })` | A completed inspection with `syncStatus: 'synced'`, a `submissionId`, and the first two answers. |
| [ ] | `13-mongosh-password-hashing.png` | `db.users.aggregate([{ $group: { _id: { $substrBytes: ['$passwordHash', 0, 7] }, n: { $sum: 1 } } }])` | Result `{ _id: '$2a$12$', n: ... }`, which proves bcrypt with cost 12 and that no plain password is stored. (This prints only the first 7 characters, never a full hash.) |
| [ ] | `14-mongosh-indexes.png` | `db.equipment.getIndexes()` | The `organisationId_1` index and the unique `organisationId_1_serialNumber_1` index. |
| [ ] | `15-mongosh-no-replication.png` | `rs.status()` | The message "not running with --replSet". Use this to explain that the database is a single local server (see Part 12). |
| [ ] | `16-compass-collections.png` | MongoDB Compass, connect to `mongodb://localhost:27017`, open the `siteready_nz` database. | The four collections and their document counts. |
| [ ] | `17-compass-inspection-document.png` | Compass, open `inspections`, expand one document. | The document with its `items` array, `status` and `syncStatus`. (Your design document says Atlas. You use a local database, which the assignment allows. Say so in the report.) |

## Part 3. The API starts (terminal)

| Done | File name | Go to | Must show |
|---|---|---|---|
| [ ] | `20-api-start-and-logs.png` | Terminal 1 right after `npm run dev`, then open the app and sign in once. | `Connected to MongoDB successfully`, `VAPID keys configured for Web Push`, `SiteReady NZ API running on http://localhost:5000`, and a few `http:` request lines. |
| [ ] | `21-log-files.png` | VS Code, open `backend/logs/combined.log` and `backend/logs/error.log`. | Time-stamped lines with levels (`http`, `warn`, `info`). Make a wrong-password sign-in first so a `warn` line exists. |

## Part 4. Postman (API testing)

Import both files named `SiteReady-NZ.postman_collection.json` and `SiteReady-NZ.postman_environment.json` from
`backend/src/postman/`, and choose the environment **SiteReady NZ (local)** at the top right.
Click a request, press **Send**, then screenshot the request, the status and the **Test Results** tab.
Folders must run in order the first time (use **Run collection**), so the saved ids and tokens exist.

| Done | File name | Go to (request name in the collection) | Must show |
|---|---|---|---|
| [ ] | `30-postman-register-201.png` | **1. Auth > POST /auth/register (manager)** | Status `201 Created`, the token in the body, passing tests. |
| [ ] | `31-postman-login-jwt-200.png` | **1. Auth > POST /auth/login (manager)** | `200 OK` with a three-part JWT. |
| [ ] | `32-postman-bearer-token.png` | **1. Auth > GET /auth/me**, open the **Authorization** tab | The Bearer token set to `{{managerToken}}`, and the `200` answer. |
| [ ] | `33-postman-create-staff-201.png` | **2. Staff > POST /api/staff (manager creates staff)** | `201` and `"role": "staff"`. |
| [ ] | `34-postman-create-equipment-201.png` | **3. Equipment > POST /api/equipment (create)** | `201`, and the status `overdue` worked out by the server. |
| [ ] | `35-postman-list-equipment-200.png` | **3. Equipment > GET /api/equipment (list)** | `200` with an array. |
| [ ] | `36-postman-update-equipment-200.png` | **3. Equipment > PUT /api/equipment/:id (update)** | `200`, the new location, and the status now `due_soon`. |
| [ ] | `37-postman-delete-equipment-204.png` | **3. Equipment > DELETE /api/equipment/:id** | `204 No Content` and an empty body. |
| [ ] | `38-postman-assign-inspection-201.png` | **4. Inspections > POST /api/inspections (manager assigns)** | `201` with the checklist `items` built from the template. |
| [ ] | `39-postman-get-inspections-200.png` | **4. Inspections > GET /api/inspections (manager overview)** | `200` with the array. |
| [ ] | `40-postman-submit-inspection-200.png` | **4. Inspections > POST /api/inspections/submit (staff finishes the checklist)** | `200` and `"status": "completed"`. |
| [ ] | `41-postman-duplicate-upload-safe.png` | **the same upload again is safe** and **a DIFFERENT upload for a finished check (409)** | `200` for the retry and `409` for a different upload. This is the "no double count" rule. |
| [ ] | `42-postman-delete-inspection.png` | **4. Inspections > DELETE ... (manager, open check)** then **(a completed check is kept)** | `204`, then `409`. |
| [ ] | `43-postman-push-send-200.png` | **5. Push notifications > POST /api/push/send (manager sends to staff)** | `200` with `devices`, `delivered` and a message. |
| [ ] | `44-postman-push-unsafe-address-400.png` | **5. Push notifications > POST /api/push/subscribe (an unsafe address is refused)** | `400`. |
| [ ] | `45-postman-error-401-403-404.png` | **6. Error codes > 401: no token**, **403: staff on a manager-only route**, **404: unknown equipment id** | The three statuses (one collage is fine). |
| [ ] | `46-postman-error-400-409.png` | **6. Error codes > 400: required fields missing** and **409: email already registered** | `400` with a list of problems and `409`. |
| [ ] | `47-postman-nosql-injection-blocked.png` | **6. Error codes > 400: NoSQL injection, operator in the email** | The body `{ "email": { "$gt": "" } ... }` answered with `400`. |
| [ ] | `48-postman-runner-summary.png` | Right-click the collection, **Run collection**, **Run** | The finished summary: all requests green, and the totals (55 requests, 163 checks passed). |
| [ ] | `49-newman-command-line.png` | Terminal: `cd backend/src/postman` then `npx newman run SiteReady-NZ.postman_collection.json -e SiteReady-NZ.postman_environment.json` | The final table with `failed 0`. (Restart the API first if you already ran the collection twice, because of the sign-in limit.) |

## Part 5. The app (Chrome, `http://localhost:5173`)

| Done | File name | Go to | Must show |
|---|---|---|---|
| [ ] | `50-app-register.png` | `/register` (page title "Set up your workspace") | The form with Full name, Work email and Password, and the **Create account** button. |
| [ ] | `51-app-login.png` | `/login` (title "Welcome back") | The form, **Sign in**, and **Continue with Google**. |
| [ ] | `52-app-login-validation.png` | `/login`, type a bad email like `abc`, click out of the field, then submit a wrong password | The inline message under the field, then the red error for a wrong password. |
| [ ] | `53-app-equipment-dashboard.png` | Sign in as the manager, click **Equipment** | The readiness summary and the list with all four status badges (Ready, Due soon, Check overdue, Expired). |
| [ ] | `54-app-equipment-filter.png` | **Equipment**, use the search box and status filter | The list narrowed to one status. |
| [ ] | `55-app-add-equipment-validation.png` | **Equipment**, click **Add equipment**, leave the name empty, click in and out of fields | The slide-over "Add equipment" showing red messages under the empty fields. |
| [ ] | `56-app-edit-equipment.png` | **Equipment**, click the **Actions for ...** button at the right of a row, then **Edit** | The slide-over "Edit equipment" with the item's values. |
| [ ] | `57-app-delete-equipment-confirm.png` | **Equipment**, click **Actions for ...** at the right of a row, then **Delete** | The dialog "Delete ...?" with **Keep it** and the red **Delete equipment** button. |
| [ ] | `58-app-staff-page.png` | Click **Staff** | The page "Your team" listing the staff member. |
| [ ] | `59-app-add-staff.png` | **Staff**, click **Add staff member** | The slide-over "Add a staff member". |
| [ ] | `60-app-manager-inspections.png` | Click **Inspections** | The page "Site checks" with **Open** and **Completed** lists. |
| [ ] | `61-app-assign-inspection.png` | **Inspections**, click **Assign inspection** | The slide-over with Equipment, Staff member and Due date. |
| [ ] | `62-app-delete-inspection-confirm.png` | **Inspections**, click **Delete** on an open check | The dialog "Delete the check for ...?" with **Keep it** and **Delete check**. |
| [ ] | `63-app-staff-inspection-list.png` | Sign out, sign in as the staff member (`tane.walker@example.com`) | The staff **Inspections** page with the task and its due label. |
| [ ] | `64-app-checklist.png` | Open the task | The checklist with **Pass / Fail / Flag** buttons, the progress, and **Submit inspection** (disabled until everything is answered). |
| [ ] | `65-app-checklist-note-required.png` | Choose **Fail** on one question and leave its note box empty | The note box that appeared under the question, and the blocked Submit button with the text "Add a note to 1 failed or flagged item". |
| [ ] | `66-app-submit-success.png` | Answer everything, click **Submit inspection** | The toast "Inspection submitted". |
| [ ] | `67-app-mobile-375.png` | F12, click the device toolbar icon (phone and tablet), set width 375, open a checklist | The checklist on a 375px phone screen with the bottom bar. |
| [ ] | `68-app-mobile-menu.png` | Same phone view, click the three-line **Open menu** button at the top left | The mobile navigation drawer. |
| [ ] | `69-app-history-after-equipment-delete.png` | As manager, delete the equipment of a finished check, then open **Inspections** | The finished check still listed as **Removed equipment**. |

## Part 6. Chrome DevTools (Inspect), offline and the PWA

Press `F12` in Chrome on `http://localhost:5173`, then use the **Application** tab.

| Done | File name | Go to | Must show |
|---|---|---|---|
| [ ] | `70-devtools-manifest.png` | Application > **Manifest** | Name "SiteReady NZ", theme colour, `standalone`, start URL `/`, and the icons. |
| [ ] | `71-devtools-service-worker.png` | Application > **Service workers** | `sw.js` with status "activated and is running", scope `http://localhost:5173/`. |
| [ ] | `72-devtools-cache-storage.png` | Application > **Cache storage**, open `api-cache` and the `workbox-precache` entry | The saved files (app shell) and saved API answers. |
| [ ] | `73-devtools-cache-storage-usage.png` | Application > **Storage** (top of the left list) | The usage bar showing how much the app has saved. |
| [ ] | `74-devtools-indexeddb.png` | Application > **IndexedDB** > `siteready-db` > `inspections` | The saved task rows. |
| [ ] | `75-devtools-indexeddb-stores.png` | Same, expand `siteready-db` | The three stores: `inspections`, `drafts`, `outbox`. |
| [ ] | `76-devtools-network-offline.png` | **Network** tab, set the throttling list to **Offline**, reload | The app still opens, and the amber "You are offline" strip shows. |
| [ ] | `77-app-offline-banner-checklist.png` | While Offline, sign in as staff and open a checklist | The checklist with the amber "You are offline" banner. |
| [ ] | `78-app-offline-submit-waiting.png` | While Offline, answer everything and submit | The message that it will upload when back online, and the "waiting to upload" card. |
| [ ] | `79-devtools-indexeddb-outbox.png` | Application > IndexedDB > `siteready-db` > `outbox` (still Offline) | One saved entry with `state: 'waiting'` and its `submissionId`. |
| [ ] | `80-app-offline-sync-complete.png` | Set throttling back to **No throttling** | The toast "Inspection uploaded", and `outbox` now empty. |
| [ ] | `81-browser-install-app.png` | Click the install icon at the right of the address bar | The "Install SiteReady NZ" prompt. |

## Part 7. Push notifications

| Done | File name | Go to | Must show |
|---|---|---|---|
| [ ] | `85-push-permission-prompt.png` | Staff account, click **Turn on reminders** | Chrome's "Show notifications" permission prompt. |
| [ ] | `86-push-reminders-on.png` | After clicking **Allow** | The card "Reminders are on". |
| [ ] | `87-push-notification-received.png` | Chrome signed in as the staff member with reminders on (screenshot 86). In Postman, in the **demo data** collection, run **10. Send a test notification to the staff member** | The Windows notification that pops up, and the Postman answer with `delivered: 1`. |
| [ ] | `88-push-manager-overdue-alert.png` | A second Chrome window (or profile) signed in as **you, the manager**, with reminders on. In the demo collection run **11. Run the automatic reminder and overdue checks** | The "Inspection is overdue" notification naming the staff member and the First aid kit, and the answer with `lateAlerts: 1`. |
| [ ] | `89-push-blocked-state.png` | Chrome site settings, set Notifications to **Block**, reload | The card "Reminders are blocked" with the plain-English help. |

Two notes on push screenshots: Chrome only shows a push notification when permission is granted for that browser profile, so use a normal Chrome window for each person. The demo staff member is `tane.walker@example.com` with password `correct-horse-battery`. Turning reminders on in a brand-new Chrome profile can take up to a minute (Google's push service is slow to register it), so wait for the card to say **Reminders are on** before sending. If a notification does not appear, send it once more.

## Part 8. Tests and code quality

| Done | File name | Go to | Must show |
|---|---|---|---|
| [ ] | `90-tests-backend.png` | Terminal: `cd backend` then `npm test` | `Test Suites: 19 passed`, `Tests: 244 passed`. |
| [ ] | `91-tests-backend-coverage.png` | `npm run test:coverage` in `backend` | The coverage table (about 96% of lines). |
| [ ] | `92-tests-frontend.png` | `cd frontend` then `npm test` | `Test Suites: 22 passed`, `Tests: 279 passed`. |
| [ ] | `93-tests-frontend-coverage.png` | `npm run test:coverage` in `frontend` | The coverage table (about 57% of lines overall, and 100% on the logic files). |
| [ ] | `94-test-file-example.png` | Open `backend/src/tests/inspectionService.test.ts` | A test with its `expect(...)` lines, for example the duplicate-upload test. |
| [ ] | `95-http-tests.png` | Open `backend/src/tests/http.test.ts` | The NoSQL-injection tests (`it.each` with the `$gt` cases). |

## Part 9. Debugging and error handling

| Done | File name | Go to | Must show |
|---|---|---|---|
| [x] | `debug-01-watchers.png` | Already taken | Paused at a breakpoint with Watch values. |
| [ ] | `96-debug-breakpoints-list.png` | Repeat `docs/DEBUGGING.md` Option A (breakpoints on lines 102 and 123 of `inspectionService.ts`) and open the **Breakpoints** panel | Both breakpoints ticked, plus the yellow line. |
| [ ] | `97-debug-step-over.png` | Press `F10` once, then screenshot | `answers.size` now showing a number in the Watch panel. |
| [ ] | `98-debug-call-stack.png` | While paused | The Call Stack listing `submitInspection` and the test that called it. |
| [ ] | `99-error-boundary.png` | Open `frontend/src/components/ErrorBoundary.tsx` | The `componentDidCatch` method and the friendly fallback text. |

## Part 10. Google sign-in (OAuth 2.0)

| Done | File name | Go to | Must show |
|---|---|---|---|
| [ ] | `100-google-oauth-client.png` | Google Cloud Console > **APIs and Services** > **Credentials** > your OAuth client | The authorised redirect URI `http://localhost:5000/auth/google/callback`. **Crop out or hide the client secret.** |
| [ ] | `101-google-consent-screen.png` | In the app click **Continue with Google** | Google's account chooser. |
| [ ] | `102-google-signed-in.png` | Finish the Google sign-in | The signed-in app (a new manager workspace for that Google account). |

## Part 11. Git and GitHub

| Done | File name | Go to | Must show |
|---|---|---|---|
| [ ] | `105-git-log.png` | Terminal: `git log --oneline` | The commits for each phase (`feat(phase-1)` and so on). |
| [ ] | `106-github-repo.png` | `https://github.com/SujalGajera/SiteReadyNZ` | The repository page with the file list. (Make it public, or add your marker, before you submit.) |
| [ ] | `107-github-no-env.png` | On GitHub open the `backend` folder | Only `.env.example`, no `.env`. |

## Part 12. Bonus: database replication and scaling (optional, not done)

Nothing is set up, and screenshot 15 shows the database is a single local server. If you choose to do the bonus:
create a free MongoDB Atlas cluster (it is a 3-member replica set by default), put its connection string in `backend/.env`
as `MONGODB_URI`, restart the API, and screenshot the cluster page, the connection string with the password hidden, and
`rs.status()` in mongosh. The code needs no change.

---

## Where the 12 screenshots in your design document are now

| Design document # | This guide |
|---|---|
| 1 Project setup | `01-setup-commands.png` |
| 2 Service worker | `71-devtools-service-worker.png` |
| 3 Equipment dashboard | `53-app-equipment-dashboard.png` |
| 4 Add equipment validation | `55-app-add-equipment-validation.png` |
| 5 Checklist, offline banner | `77-app-offline-banner-checklist.png` |
| 6 IndexedDB | `74-devtools-indexeddb.png` |
| 7 Postman POST equipment 201 | `34-postman-create-equipment-201.png` |
| 8 Postman GET inspections with JWT | `39-postman-get-inspections-200.png` and `32-postman-bearer-token.png` |
| 9 MongoDB inspection document | `17-compass-inspection-document.png` and `12-mongosh-inspection-document.png` |
| 10 Push notification received | `87-push-notification-received.png` |
| 11 Unit tests passing | `90-tests-backend.png` and `92-tests-frontend.png` |
| 12 Debugger with watchers | `debug-01-watchers.png` |
