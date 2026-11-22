# What SiteReady NZ uses, where, and why

One or two sentences per item. Every file named here exists in the project.
"Not used" is stated plainly where something from the course is not part of this project.

---

## 1. How the project was built (design methodology)

- **Phased, step-by-step build.** The app was built in 8 phases (setup, login, equipment, offline checklists, push, testing, patterns, report), each finished, tested and committed before the next (`agents/AGENT_RULES.md`, `agents/CHANGELOG.md`). This kept every step small enough to check.
- **Layered architecture.** The backend is split into routes, controllers, services, repositories and models, so each file has one job and can be tested alone (`backend/src/`).
- **Offline-first.** The app is designed to work with no signal and sync later, because inspections happen in basements and stairwells (`frontend/src/sw/`, `frontend/src/services/offlineDb.ts`).
- **Mobile-first.** Layouts start at a 375px phone and grow, and the Pass/Fail/Flag buttons are 48px tall for gloved or hurried thumbs (`frontend/src/components/inspection/AnswerToggle.tsx`).
- **Security by design.** Logins, roles, validation and rate limits were built in from Phase 2, not added at the end.
- **Tests after the code, plus "break it on purpose".** Features were built first and the unit tests written in Phase 6, then key rules were deliberately broken to prove a test fails (this is not test-first development). Each feature was also checked by hand and with scripts in the phase it was built.

## 2. Design patterns

- **Repository.** All database queries live in four files, so services contain only business rules and tests can swap in a fake (`backend/src/repositories/`).
- **Strategy.** The "ok / due soon / overdue / expired" rule is one replaceable function, so a new rule can be passed in without editing the calculator (`backend/src/utils/statusCalculator.ts`, `frontend/src/utils/statusCalculator.ts`).
- **Observer.** The uploader announces "upload finished" and screens that care subscribe, so neither knows about the other (`frontend/src/services/syncEvents.ts`).
- **Context / Provider.** Who is signed in, whether the phone is online and what is waiting to upload are shared through three providers instead of passing props down (`frontend/src/context/`).
- **Singleton.** One shared web client, one logger and one IndexedDB connection (`frontend/src/services/api.ts`, `backend/src/config/logger.ts`, `getDatabase()` in `offlineDb.ts`).
- **Simple Factory.** One function builds the right checklist for each equipment type (`buildChecklist` in `backend/src/utils/checklistTemplates.ts`).
- **Proxy.** The service worker sits between the app and the network and answers from its saved copy when there is no signal (`frontend/src/sw/sw.ts`).
- **Decorator (loosely).** Workbox plugins wrap the network strategy to add expiry and "only keep good answers" (`ExpirationPlugin`, `CacheableResponsePlugin` in `sw.ts`).
- **Intercepting Filter.** Every request passes a chain of middleware (security headers, CORS, JSON, logging, login, role, validation) before reaching the controller (`backend/src/app.ts`, `backend/src/routes/`), and one Axios interceptor watches every reply for an expired session (`api.ts`).
- **Composite View.** Screens are built from nested small components, for example Dashboard, then EquipmentList, then EquipmentRow (`frontend/src/pages/`, `frontend/src/components/`).
- **Service to Worker (closest match).** A route picks the controller, the controller hands the work to a service, and the service does it (`routes/`, `controllers/`, `services/`); it is not labelled that way in the code.
- **Not used:** Factory Method (as separate creator classes) and a hand-written Decorator class.

## 3. SOLID principles

- **S, single responsibility.** Controllers only handle HTTP, services only hold rules, repositories only talk to the database.
- **O, open/closed.** A new status rule or a new equipment checklist is added without editing the code that uses it (Strategy and the templates).
- **L, Liskov substitution.** A fake repository in a test behaves like the real one, so services work with either.
- **I, interface segregation.** Each repository has a small interface for one kind of record, and a service imports only the repositories it needs (`EquipmentRepository`, `UserRepository`, and so on).
- **D, dependency inversion (partly).** Services depend on repository interfaces and tests replace them, but the real repositories are imported directly, not injected by a container.

## 4. Backend and API

- **Backend.** Node.js with Express and TypeScript, using Mongoose to talk to MongoDB (`backend/server.ts`, `backend/src/app.ts`).
- **REST API.** Standard JSON endpoints with the right status codes (201, 200, 204, 400, 401, 403, 404, 409), listed in the Postman collection (`backend/src/postman/`).
- **Validation.** Every route checks its input before any logic runs, and refuses wrong types such as an object where text is expected (`express-validator`, `backend/src/utils/validation.ts`).
- **Error handling.** One handler turns every error into a clean JSON answer and hides internal details on a 500 (`backend/src/middleware/errorHandler.ts`).
- **Full CRUD on two features.** Equipment has create, read, update and delete, and inspections have assign, list, submit and delete (`equipmentRoutes.ts`, `inspectionRoutes.ts`).
- **Security.** Passwords are hashed with bcrypt (cost 12), login is a JWT in an httpOnly cookie, roles guard manager routes, and helmet, CORS and a login rate limit are on (`authService.ts`, `jwtHelper.ts`, `authMiddleware.ts`, `roleGuard.ts`).
- **NoSQL-injection and mass-assignment defence.** Inputs are type-checked, only whitelisted fields are copied, and every query is limited to the caller's workspace (`equipmentService.ts`, `repositories/`).
- **Google sign-in.** OAuth 2.0 through Passport, with a random `state` value checked on return and only Google-verified emails accepted (`middleware/googleOAuth.ts`, `services/authService.ts`).

## 5. Database and MongoDB tools

- **MongoDB with Mongoose.** Four collections: users, equipment, inspections and pushsubscriptions, with typed schemas (`backend/src/models/`).
- **Indexes.** A workspace index makes every list fast, and a unique index stops two items in one workspace sharing a serial number (`Equipment.ts`).
- **mongosh.** The MongoDB shell, used to look at the stored data from the command line, for example `db.equipment.find({}, {name:1, status:1})` (commands in `docs/SCREENSHOTS.md`).
- **MongoDB Compass.** The visual tool for browsing the same collections and documents, used for the database screenshots.
- **Replication and sharding: not used.** The database is one local server (`rs.status()` answers "not a replica set"); a MongoDB Atlas cluster would give a replica set, and sharding is only needed at a size this app does not reach.

## 6. PWA, service worker and offline storage

- **Web App Manifest.** Name, icons, colours and `standalone` mode make the app installable on a phone (generated from `frontend/vite.config.ts`).
- **Service worker.** A Workbox worker saves the app for offline use, answers from its copy with no signal, and uploads waiting checklists later (`frontend/src/sw/sw.ts`); Workbox creates the install, activate and fetch handlers for us.
- **Service worker registration.** One small file asks the browser to install the worker (`frontend/src/sw/registerServiceWorker.ts`).
- **Cache Storage.** The app shell (24 files) is saved on install and read back first, and API answers use "network first, saved copy as backup" for 7 days (`precacheAndRoute`, `NetworkFirst` in `sw.ts`).
- **IndexedDB.** A browser database called `siteready-db` holds the cached task list, half-finished drafts and the outbox of finished checklists (`frontend/src/services/offlineDb.ts`).
- **Background Sync.** The browser wakes the worker when the signal returns so waiting checklists upload even if the app is closed (`sync` event in `sw.ts`).
- **Safe retries.** Each upload carries a unique `submissionId`, so a retry after a dropped connection never creates a second record (`inspectionService.ts`, `outboxUploader.ts`).

## 7. Push notifications

- **VAPID keys.** A public and private key pair identifies our server to the browser's push service; the private key stays in `backend/.env` (`backend/src/config/vapid.ts`).
- **Subscribing.** The browser asks permission, creates a subscription with `PushManager.subscribe()` and sends it to the server (`frontend/src/services/pushClient.ts`).
- **Sending.** The server encrypts and sends the message with the `web-push` library, and removes devices the push service says are gone (`backend/src/services/pushService.ts`).
- **Showing.** The worker's `push` event calls `showNotification`, and tapping it opens the right page (`sw.ts`).
- **Automatic reminders.** A timer checks every 15 minutes for checks due today or tomorrow and checks more than a day late, and tells each person once (`notificationService.ts`, `jobs/notificationScheduler.ts`).
- **Safety.** Only real browser push addresses are accepted, so the server cannot be tricked into calling an internal address (`backend/src/utils/pushEndpoint.ts`).

## 8. Testing, debugging and tools

- **Unit tests.** Jest on both sides, and React Testing Library on the frontend (backend 244 tests, frontend 279 tests).
- **HTTP tests.** Supertest sends real requests through the real Express app to check the order of login, role and validation (`backend/src/tests/http.test.ts`).
- **Break-it-on-purpose checks.** Key rules were broken deliberately, one at a time, to confirm a test fails every time.
- **Postman.** A saved collection of 55 requests and 163 checks that runs in order against the live API (`backend/src/postman/`).
- **Breakpoints.** A red dot on a line stops the program there, so you can read what the variables really hold (set on lines 102 and 123 of `backend/src/services/inspectionService.ts`).
- **Watchers.** The Watch panel keeps an eye on chosen values while you step through, such as `input.submissionId`, `inspection.status`, `caller.role`, `input.items.length` and `answers.size` (`docs/DEBUGGING.md`).
- **VS Code debug setup.** Ready-made launch settings for the API, a test file and Chrome (`.vscode/launch.json`).
- **Logging.** Winston writes to the screen and to log files, and Morgan records every request into it (`backend/src/config/logger.ts`, `backend/logs/`).
- **Error boundary.** A crash on one screen shows a friendly message instead of a blank page (`frontend/src/components/ErrorBoundary.tsx`).
- **Chrome DevTools (Inspect).** Application tab for the service worker, Cache Storage, IndexedDB and manifest; Network tab to switch to Offline; the device toolbar for a 375px phone view.

## 9. Frontend

- **React 18 with TypeScript and Vite.** Components, hooks and a fast build (`frontend/`).
- **Custom hooks.** Loading and saving data lives in hooks so pages only lay things out (`frontend/src/hooks/`).
- **Tailwind CSS and ShadCN.** Utility styling and accessible base components (`frontend/src/components/ui/`).
- **Form validation.** Plain functions check each field and errors appear when you leave the field (`frontend/src/utils/validators.ts`).
- **Route guards.** Signed-out visitors go to login, and staff cannot open manager pages (`frontend/src/components/routing/RouteGuards.tsx`).
- **Unmount safety.** Data hooks stop updating a screen the person has already left (`frontend/src/hooks/useIsMounted.ts`).
