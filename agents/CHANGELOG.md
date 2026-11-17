# 📋 CHANGELOG — SiteReady NZ
### File-by-file build log | IA730001 Block 4, 2026

> This file is updated **every time a file is created or significantly changed**. It records what code is in each file, what pattern or structure is used, and **why** — in plain English.

---

## How to Read This File

Each entry follows this format:

```
### [PATH/TO/FILE.ts]
**Status:** Created | Modified | Deleted
**Phase:** Which development phase this belongs to
**Pattern:** Which design pattern (if any) is applied
**What it does:** Plain English description
**Why structured this way:** Reasoning behind the structure
**Key decisions:** Any choices worth documenting
```

---

## Phase 1 — Project Bootstrap & Configuration

### [backend/package.json]
**Status:** Created
**Phase:** Phase 1 — Project Bootstrap & Configuration
**Pattern:** None
**What it does:**
Declares all runtime and development dependencies for the Express API. Scripts: `dev` runs ts-node with nodemon for hot reload, `build` compiles TypeScript to dist/, `start` runs the compiled output.

**Why structured this way:**
Separating dev and runtime dependencies keeps the production Docker image lean. All type packages are devDependencies because TypeScript types are erased at compile time.

**Key decisions:**
- bcrypt salt rounds ≥ 12 (AGENT_RULES security requirement)
- web-push included for VAPID-based push notifications
- passport + passport-google-oauth20 for Google OAuth 2.0

---

### [backend/tsconfig.json]
**Status:** Created
**Phase:** Phase 1 — Project Bootstrap & Configuration
**Pattern:** None
**What it does:**
TypeScript compiler configuration targeting ES2020 with strict mode on. Output goes to dist/, source lives in src/. sourceMap enables VS Code debugging with breakpoints.

**Why structured this way:**
Strict mode catches null/undefined issues at compile time — critical for a data-entry app where missing fields cause runtime failures. commonjs module format is required because Node.js does not natively support ES modules without flags.

**Key decisions:**
- `strict: true` — no implicit any, strict null checks
- `esModuleInterop: true` — allows `import x from 'module'` syntax for CommonJS packages

---

### [backend/.env.example]
**Status:** Created
**Phase:** Phase 1 — Project Bootstrap & Configuration
**Pattern:** None
**What it does:**
Documents every environment variable the backend needs with dummy placeholder values. Developers copy this to `.env` and fill in real values. The real `.env` is gitignored.

**Why structured this way:**
Keeping dummy values in .env.example means a new developer can clone the repo and immediately see every variable they need to configure — no hunting through code to find what is missing.

**Key decisions:**
- VAPID_EMAIL uses `mailto:` prefix as required by the web-push spec
- CLIENT_URL is included so CORS and OAuth redirects stay configurable without code changes

---

### [backend/server.ts]
**Status:** Created
**Phase:** Phase 1 — Project Bootstrap & Configuration
**Pattern:** None
**What it does:**
Entry point for the API process. Loads dotenv first (before any other import reads env vars), connects to MongoDB via connectToDatabase(), then starts listening on the configured PORT.

**Why structured this way:**
dotenv.config() must run before any other import that reads process.env, which is why it is at the very top. Connecting to MongoDB before app.listen() means the server never accepts requests without a database connection.

**Key decisions:**
- Database connection is awaited before starting the HTTP server — avoids a race condition where the first request hits before Mongoose is ready

---

### [backend/src/app.ts]
**Status:** Created
**Phase:** Phase 1 — Project Bootstrap & Configuration
**Pattern:** None
**What it does:**
Bootstrap file for the Express application. Applies middleware in order (CORS → JSON parsing → logging → routes → error handler) and mounts all route groups.

**Why structured this way:**
Separating app.ts from server.ts means tests can import the Express app without starting a real server on a port. The global error handler must be registered last — Express identifies it by its four-argument signature.

**Key decisions:**
- CORS is locked to CLIENT_URL (not `*`) for security — required by AGENT_RULES
- Routes are mounted at `/auth`, `/api/equipment`, `/api/inspections`, `/api/push`

---

### Phase 1 — Audit and completion (second session)

The first session wrote code beyond Phase 1 without checking it. This session audited it. Findings: the backend did not compile (4 TypeScript errors), the frontend used hand-made UI parts instead of ShadCN, there was no `.gitignore`, no frontend `.env.example`, and the PWA manifest link pointed at a file that did not exist. Frontend files that belong to Phases 3 to 5 were moved to `frontend/_pending/` (outside the build) so each phase is rebuilt in order against the new design system. Nothing was deleted.

### [backend/tsconfig.json] and [backend/package.json]
**Status:** Modified
**Phase:** Phase 1
**Pattern:** None
**What it does:** `rootDir` changed from `src` to `.` because `server.ts` sits outside `src`. The `dev` script now runs `ts-node server.ts` directly.
**Why structured this way:** With `rootDir: src`, `tsc` refused to build because `server.ts` was outside it.

### [backend/src/middleware/authMiddleware.ts] and [backend/src/controllers/equipmentController.ts]
**Status:** Modified
**Phase:** Phase 1
**Pattern:** None
**What it does:** `req.user` is now typed by extending `Express.User` (Passport already owns that name). Equipment updates copy only whitelisted fields with `equipment.set()` instead of an unsafe cast.
**Why structured this way:** Re-declaring `user` on `Request` clashed with Passport's own declaration and broke 3 files. The whitelist also stops a caller changing `status` or `_id` through the request body.

### [backend/src/config/passport.ts]
**Status:** Modified
**Phase:** Phase 1
**Pattern:** Strategy (Passport)
**What it does:** The Google strategy is only registered when Google credentials exist, and a warning is printed otherwise.
**Why structured this way:** `passport-google-oauth20` throws on an empty client ID, which stopped the whole API from starting before Google was set up.

### [.gitignore], [frontend/.env.example]
**Status:** Created
**Phase:** Phase 1
**What it does:** Keeps `.env`, `node_modules` and build output out of git (AGENT_RULES 17). The frontend example lists `VITE_API_URL` and `VITE_VAPID_PUBLIC_KEY`.

### [frontend/tailwind.config.ts], [frontend/src/index.css], [frontend/components.json]
**Status:** Modified / Created
**Phase:** Phase 1
**Pattern:** Design tokens
**What it does:** Defines the SiteReady palette as CSS variables: warm paper background, green-black ink, forest green for actions, ochre for "due soon", brick red for "overdue". ShadCN reads the same variables, so every ShadCN component matches the brand.
**Why structured this way:** The default zinc and emerald look was dropped on purpose to avoid a generic template feel. Changing one variable restyles the whole app. Inter is bundled with the app so it also works offline.
**Key decisions:** Status colours are `ok`, `warn`, `danger` (each with a `soft` background). Easing curve `ease-snap` is the rules' `cubic-bezier(0.16, 1, 0.3, 1)`. A reduced-motion rule switches animation off for users who ask for that.

### [frontend/src/components/ui/*] (ShadCN)
**Status:** Created via `shadcn add`
**Phase:** Phase 1
**What it does:** button, input, label, badge, card, select, dialog, alert-dialog, dropdown-menu, progress, tooltip, textarea, table, separator, skeleton, drawer (Vaul), plus `sonner.tsx` (toasts).
**Key decisions:** `Button` gained a `loading` prop (spinner + blocked clicks) and a small press effect. Default button height is 44px to meet the touch target rule.

### [frontend/src/components/layout/*]
**Status:** Created / Modified
**Phase:** Phase 1
**What it does:** `AppShell` = `Sidebar` (desktop) + `Topbar` (breadcrumb, account menu) + `OfflineBanner` + page. On phones the sidebar becomes a Vaul drawer (`MobileNav`). `navigation.ts` is the single list of links, filtered by role. `BrandMark` is an inline SVG logo.
**Why structured this way:** One nav list drives both the sidebar and the drawer, so they cannot drift apart. The offline banner slides with `transform` and `opacity` only and has no dismiss button.

### [frontend/src/components/ErrorBoundary.tsx], [frontend/src/main.tsx], [frontend/vite.config.ts], [frontend/index.html]
**Status:** Created / Modified
**Phase:** Phase 1
**What it does:** Error boundary around the app. Providers and the Sonner toaster mounted in `main.tsx`. `@` path alias. The service worker is on in dev too, falls back to `index.html` for page loads (never for `/api` or `/auth`), and the broken manual manifest link was removed.
**Done check:** Both servers start. In a real Chrome run against the production build the service worker reported `activated`, the manifest link resolved, and there were no console errors.

---

## Phase 2 — Authentication System

### Phase 2 — Audit and completion (second session)

**Decision: JWT in an httpOnly cookie, not localStorage.** The browser cannot read an httpOnly cookie, so a script injected into the page cannot steal the login. The cookie is `SameSite=Lax` (not sent on cross-site POSTs, which blocks basic CSRF) and `Secure` in production. The login response still includes the token in its body so Postman can use `Authorization: Bearer <token>`. The server accepts either.

**What the audit found and fixed:**
- API returned `_id` but the frontend expected `id`; `passwordHash` was not excluded from queries. Now `toJSON` exposes `id` and hides the hash and Google ID, and `passwordHash` has `select: false`.
- No `/auth/me` or `/auth/logout`, so the frontend could not restore a session. Added both.
- Google callback put the token in the URL (leaks into history and logs) and never checked the OAuth `state`. Now the token goes only in the cookie, and `state` is a random value held in a 10-minute httpOnly cookie, compared with `timingSafeEqual`.
- `normalizeEmail()` rewrites Gmail addresses (removes dots), which would stop Google accounts linking. Removed; the service lowercases and trims instead.
- Added rate limiting (20 attempts per 15 minutes on login and register), `helmet` headers, a 1 MB JSON body limit, and a max password length of 72 (bcrypt ignores the rest).
- The error handler no longer prints stack traces for expected 4xx errors and no longer sends internal messages to the client on 500s.

### [backend/src/services/authService.ts]
**Status:** Created
**Phase:** Phase 2
**Pattern:** Service layer
**What it does:** `registerUser`, `authenticateUser`, `getUserById`. Hashes passwords with bcrypt (12 rounds) and throws errors carrying an HTTP status.
**Why structured this way:** Controllers stay thin (AGENT_RULES 12). "No such email" and "wrong password" give the same 401 message, so attackers cannot discover which emails are registered.

### [backend/src/controllers/authController.ts], [backend/src/routes/authRoutes.ts]
**Status:** Modified
**Phase:** Phase 2
**What it does:** `register` (201), `login` (200), `logout` (204), `getCurrentUser` (200), `googleCallback` (redirect). Validation rules live next to each route. Validation failures return `{ error, errors[] }` so the UI can show one sentence or per-field messages.

### [backend/src/utils/authCookie.ts], [backend/src/middleware/authMiddleware.ts], [backend/src/middleware/googleOAuth.ts]
**Status:** Created / Modified
**Phase:** Phase 2
**Pattern:** Middleware chain
**What it does:** One place sets and clears the cookies. `requireAuthentication` reads the cookie first, then the Bearer header. `googleOAuth.ts` splits the Google flow into three steps: start (create `state`), verify (compare `state`), complete (Passport). If Google keys are missing, the user is sent back to `/login` with a clear message instead of a crash.

### [frontend/src/context/AuthContext.tsx], [frontend/src/hooks/useAuth.ts]
**Status:** Rewritten
**Phase:** Phase 2
**Pattern:** Context/Provider
**What it does:** Holds `user`, `isLoading`, `login`, `register`, `logout`. On load it asks `/auth/me`. If the network is down it falls back to a cached copy of the profile (never the token), so the app opens offline. On logout it also clears the cached API answers so the next person on a shared phone cannot see them.

### [frontend/src/services/api.ts]
**Status:** Rewritten
**Phase:** Phase 2
**Pattern:** Singleton
**What it does:** One Axios client with `withCredentials: true`. A 401 anywhere (except login attempts) fires a `siteready:session-expired` event, which AuthContext turns into a sign-out. Helpers turn errors into plain messages.

### [frontend/src/components/routing/RouteGuards.tsx], [frontend/src/App.tsx]
**Status:** Created / Modified
**Phase:** Phase 2
**What it does:** `ProtectedRoute` sends signed-out users to `/login` (and returns them to the page they wanted), and sends the wrong role to the home page via a `roles` prop. `PublicOnlyRoute` keeps signed-in users away from login and register. Manager-only and staff-only pages use `<ProtectedRoute roles={['manager']}>` from Phase 3.

### [frontend/src/pages/auth/Login.tsx], [Register.tsx], [components/auth/*], [hooks/useAuthForms.ts], [hooks/useFormFields.ts], [utils/validators.ts]
**Status:** Rewritten / Created
**Phase:** Phase 2
**What it does:** Split layout: a forest-green panel with a preview of the real checklist, and the form on paper. Visible labels, errors on blur, loading button, show/hide password, role chosen with two radio cards, Google button. Logic lives in hooks and pure validators (easy to unit test in Phase 6).
**Done check (real Chrome against the running servers, 21 checks):** register, login, logout, session survives reload, signed-out visitors redirected, signed-in visitors kept off /login, duplicate email message, Google-not-configured message, cookie is HttpOnly and the token is not visible to scripts, no horizontal scroll at 375px, mobile drawer opens. API checks: 201, 409, 400, 401, 403 (staff on a manager route), 204, 429 after 20 attempts, forged Google `state` rejected.
**Not yet verified:** a real Google sign-in. It needs your Google client ID and secret (see the setup note in the session summary).

---

### [backend/src/config/db.ts]
**Status:** Created
**Phase:** Phase 1–2 — Project Bootstrap & Auth System
**Pattern:** None
**What it does:**
Encapsulates the Mongoose.connect() call. Logs success on connection, logs the error and exits the process on failure.

**Why structured this way:**
Wrapping the connection in an exported async function lets server.ts await it cleanly and makes the connection mockable in tests (jest.mock('../config/db')).

**Key decisions:**
- process.exit(1) on failure — there is no sensible fallback for a database-dependent API

---

### [backend/src/config/vapid.ts]
**Status:** Created
**Phase:** Phase 1 (bootstrap) / Phase 5 (push notifications)
**Pattern:** Singleton — VAPID config is set once globally
**What it does:**
Loads VAPID keys from environment variables and calls webPush.setVapidDetails() once at startup. Exports the public key so it can be served to the frontend via an API endpoint.

**Why structured this way:**
web-push.setVapidDetails() is a global setter — calling it once at import time means every sendNotification call automatically uses the right keys without passing them as arguments each time.

**Key decisions:**
- Warns rather than exits if keys are missing — the rest of the API still works without push

---

### [backend/src/config/passport.ts]
**Status:** Created
**Phase:** Phase 2 — Authentication System
**Pattern:** Strategy Pattern — Passport uses pluggable strategies
**What it does:**
Configures the Passport.js Google OAuth 2.0 strategy. After Google authenticates the user, it looks up an existing account by googleId or email, links the Google ID if found, or creates a new account for first-time Google users.

**Why structured this way:**
Passport strategies are self-contained — the callback only runs after Google confirms the user's identity, so we can trust the profile data. The upsert-style logic (find by googleId → find by email → create) handles all three first-sign-in scenarios.

**Key decisions:**
- session: false throughout — we use JWT, not Passport session serialisation
- Google-only users have no passwordHash — comparePassword() returns false for them, which is correct

---

### [backend/src/models/User.ts]
**Status:** Created
**Phase:** Phase 2 — Authentication System
**Pattern:** None
**What it does:**
Mongoose schema for application users. Covers both email/password accounts and Google OAuth accounts. Includes a comparePassword() instance method and strips passwordHash from all JSON responses.

**Why structured this way:**
Keeping comparePassword() on the model means the controller never imports bcrypt directly — the model owns its own security logic. The toJSON transform prevents accidental passwordHash leaks in any API response, regardless of which controller sends the user object.

**Key decisions:**
- passwordHash is not `required` at schema level — Google users have no password
- googleId uses `sparse: true` so the unique index allows multiple null/undefined values
- Default role is 'manager' so the first registrant can immediately manage equipment

---

### [backend/src/models/Equipment.ts]
**Status:** Created
**Phase:** Phase 3 — Equipment Management
**Pattern:** Strategy Pattern (pre-save hook encapsulates the status calculation strategy)
**What it does:**
Mongoose schema for safety equipment. Includes a pre-save hook that automatically derives the status field from expiryDate so the status is never stale after any update.

**Why structured this way:**
Putting the status calculation in a pre-save hook guarantees it runs on every save(), regardless of which controller or service triggers it. This is safer than calculating status in the controller, where it could be forgotten on an edge-case update path.

**Key decisions:**
- status is computed, never manually set by API callers
- Day boundary uses midnight-normalised dates to avoid timezone edge cases
- 30-day due_soon window matches typical NZ workplace safety review cycles

---

### [backend/src/models/Inspection.ts]
**Status:** Created
**Phase:** Phase 4 — Offline Inspection Checklist
**Pattern:** None
**What it does:**
Mongoose schema for inspection records. Embeds checklist items as a sub-document array. Tracks syncStatus to support the offline-first workflow where inspections are completed on-device and uploaded when connectivity returns.

**Why structured this way:**
Embedding items directly in the inspection document avoids a join query every time staff loads their checklist. The syncStatus field (synced/pending_sync/failed) is what the service worker uses to know what still needs uploading.

**Key decisions:**
- _id: false on item sub-schema — itemId (client-generated) serves as the identifier
- completedAt defaults to null — the service checks for null to determine if the inspection needs a timestamp on sync

---

### [backend/src/models/PushSubscription.ts]
**Status:** Created
**Phase:** Phase 5 — Push Notifications
**Pattern:** None
**What it does:**
Mongoose schema for browser push subscriptions. Stores the endpoint and VAPID encryption keys provided by the browser when a user grants notification permission.

**Why structured this way:**
One user can have subscriptions on multiple devices (phone + laptop). The compound index on (userId, endpoint) prevents duplicates for the same device while allowing multiple devices per user.

**Key decisions:**
- Compound unique index on userId+endpoint — idempotent subscribe calls are handled via upsert in the controller

---

### [backend/src/utils/jwtHelper.ts]
**Status:** Created
**Phase:** Phase 2 — Authentication System
**Pattern:** Utility / Helper
**What it does:**
Exports signToken() and verifyToken() — the only two places in the codebase where the JWT secret is accessed. signToken() creates a token containing the user's ID and role; verifyToken() decodes and validates it.

**Why structured this way:**
Centralising JWT operations means the secret handling and signing options are defined in exactly one file. If the algorithm or expiry changes, it changes in one place.

**Key decisions:**
- Role is encoded in the token so role-guard middleware does not need a DB lookup on every request
- Throws on failure — callers catch and return 401

---

### [backend/src/middleware/authMiddleware.ts]
**Status:** Created
**Phase:** Phase 2 — Authentication System
**Pattern:** Middleware / Chain of Responsibility
**What it does:**
Reads the Authorization header, extracts the Bearer token, verifies it with jwtHelper, and attaches the decoded payload to req.user. Returns 401 if the header is missing or the token is invalid.

**Why structured this way:**
Extracting auth into middleware means every protected route gets the same consistent check. Controllers never touch the Authorization header — they just read req.user which is guaranteed to be set if this middleware passed.

**Key decisions:**
- Extends Express's Request interface globally so req.user is typed across the codebase
- Returns 401 (not 403) for missing/invalid tokens — 403 is for authenticated users who lack permission

---

### [backend/src/middleware/roleGuard.ts]
**Status:** Created
**Phase:** Phase 2 — Authentication System
**Pattern:** Factory function / Chain of Responsibility
**What it does:**
Factory that returns role-checking middleware. requireRole('manager') produces a middleware that rejects any request where req.user.role !== 'manager' with 403 Forbidden.

**Why structured this way:**
The factory pattern lets the role string be declared right in the route definition (requireRole('manager')), making the security requirement obvious to anyone reading the route file — no need to look up a separate middleware file.

**Key decisions:**
- Returns 403 (not 401) — the user IS authenticated, they just lack the required permission

---

### [backend/src/middleware/errorHandler.ts]
**Status:** Created
**Phase:** Phase 1 — Project Bootstrap
**Pattern:** Chain of Responsibility (Express error middleware)
**What it does:**
Global Express error handler with four parameters (required by Express to identify it as an error handler). Logs the full error server-side and returns a clean JSON error response with the appropriate status code.

**Why structured this way:**
One central error handler means controllers never format error responses themselves — they just call next(error). The AppError interface lets any thrown error carry a custom statusCode.

**Key decisions:**
- Falls back to 500 if statusCode is not set on the error
- Logs the full error (including stack trace) server-side while returning only a message to the client

---

### [backend/src/middleware/logger.ts]
**Status:** Created
**Phase:** Phase 1 — Project Bootstrap
**Pattern:** None
**What it does:**
Exports a Morgan 'dev' format logger middleware that prints colour-coded request summaries to the console. Applied in app.ts before all routes.

**Why structured this way:**
Wrapping morgan in its own file keeps app.ts clean and makes it easy to swap the log format (e.g., 'combined' for production) without touching app.ts.

**Key decisions:**
- 'dev' format used — suitable for development; production would use 'combined' and pipe to a log aggregator

---

### [backend/src/controllers/authController.ts]
**Status:** Created
**Phase:** Phase 2 — Authentication System
**Pattern:** Thin Controller
**What it does:**
Handles register, login, and Google OAuth callback. register hashes the password with bcrypt(12), checks for duplicate emails, creates the user, and returns a JWT. login verifies credentials and returns a JWT. googleCallback signs a JWT for the OAuth-authenticated user and redirects to the frontend.

**Why structured this way:**
Controllers are intentionally thin — they validate HTTP input, call models, and format responses. No business logic (hashing, DB queries) is duplicated outside this layer.

**Key decisions:**
- Uses vague "Invalid email or password" error on login to avoid email enumeration attacks
- bcrypt cost factor 12 (AGENT_RULES minimum)
- Google callback uses redirect with token in query string — the frontend reads it on the callback page

---

### [backend/src/controllers/equipmentController.ts]
**Status:** Created
**Phase:** Phase 3 — Equipment Management
**Pattern:** Thin Controller
**What it does:**
Five CRUD handlers for the Equipment model. getAllEquipment sorts by expiryDate ascending. updateEquipment uses save() (not findByIdAndUpdate) so the pre-save status hook runs. deleteEquipment returns 204 with no body.

**Why structured this way:**
Using save() on update is deliberate — findByIdAndUpdate bypasses Mongoose middleware, which would leave the status field stale after an expiry date change.

**Key decisions:**
- Populate assignedManagerId with name only — never expose the full manager document
- 204 No Content on delete — HTTP spec says DELETE responses should have no body

---

### [backend/src/controllers/inspectionController.ts]
**Status:** Created
**Phase:** Phase 4 — Offline Inspection Checklist
**Pattern:** Thin Controller
**What it does:**
Five handlers covering the full inspection lifecycle: list all, list assigned (staff view), create, submit (with items array), and sync patch. The sync endpoint supports the offline Background Sync flow.

**Why structured this way:**
Separating submit from sync allows two different call paths: the online path (staff submits directly), and the offline path (service worker queues the submit and calls sync when back online).

**Key decisions:**
- getAssignedInspections filters by assignedStaffId — staff only see their own work
- submitInspection sets completedAt = new Date() — records the exact completion time, not when it was synced

---

### [backend/src/controllers/pushController.ts]
**Status:** Created
**Phase:** Phase 5 — Push Notifications
**Pattern:** Thin Controller
**What it does:**
subscribe upserts a browser push subscription for the authenticated user. sendNotification validates the request and delegates to pushService.sendPushToUser.

**Why structured this way:**
The actual web-push call lives in pushService.ts, not here, following the thin-controller rule. The controller's job is to validate the request and return the HTTP response.

**Key decisions:**
- Upsert strategy on subscribe — idempotent, so calling it multiple times for the same device is safe

---

### [backend/src/services/pushService.ts]
**Status:** Created
**Phase:** Phase 5 — Push Notifications
**Pattern:** Service Layer / Repository Pattern
**What it does:**
sendPushToUser() finds all push subscriptions for a given userId and calls webPush.sendNotification for each one, allowing one notification to reach all of a user's devices simultaneously.

**Why structured this way:**
The service layer isolates the web-push library from the controller. If we switch to Firebase Cloud Messaging in the future, only this file changes — the controller and routes remain untouched.

**Key decisions:**
- Promise.allSettled (not Promise.all) — a failure on one device does not prevent delivery to others
- Individual send failures are logged but do not throw — the overall operation is considered successful if at least one delivery was attempted

---

### [backend/src/routes/authRoutes.ts]
**Status:** Created
**Phase:** Phase 2 — Authentication System
**Pattern:** None
**What it does:**
Defines POST /register, POST /login, GET /google (OAuth initiation), and GET /google/callback. Applies express-validator rules inline on register and login routes.

**Why structured this way:**
Validation rules are co-located with the route definition so it is obvious at a glance what constraints each endpoint enforces.

**Key decisions:**
- session: false on passport.authenticate — stateless JWT approach, no Passport sessions

---

### [backend/src/routes/equipmentRoutes.ts]
**Status:** Created
**Phase:** Phase 3 — Equipment Management
**Pattern:** None
**What it does:**
Maps HTTP verbs + paths to equipment controller functions. GET routes require only authentication; POST, PUT, DELETE also require the manager role.

**Why structured this way:**
Stacking requireAuthentication → requireRole in the route definition makes the security model self-documenting — any developer reading the route file immediately sees what level of access each endpoint requires.

**Key decisions:**
- Validation rules shared for create; update uses optional() so partial updates are valid

---

### [backend/src/routes/inspectionRoutes.ts]
**Status:** Created
**Phase:** Phase 4 — Offline Inspection Checklist
**Pattern:** None
**What it does:**
Applies requireAuthentication to all inspection routes as a router-level middleware. Maps GET /, GET /assigned/:userId, POST /, POST /submit, PATCH /:id/sync to their respective controller functions.

**Why structured this way:**
Router-level auth middleware (router.use) is applied once instead of repeating it on every route — reduces repetition and prevents accidentally forgetting auth on a new route.

**Key decisions:**
- /submit and /assigned are defined before /:id/sync to avoid route ordering conflicts

---

### [backend/src/routes/pushRoutes.ts]
**Status:** Created
**Phase:** Phase 5 — Push Notifications
**Pattern:** None
**What it does:**
POST /subscribe is open to all authenticated users. POST /send requires the manager role so only managers can trigger notifications.

**Why structured this way:**
Keeping push routes lean — there are only two endpoints and both are security-critical, so the guard conditions are explicit on each route definition.

**Key decisions:**
- Manager-only send prevents staff from sending notifications to other users

---

## Phase 3 — Feature 1: Equipment Management

**Audit findings fixed in the existing backend:**
- Status was only worked out when a record was saved, so an item saved as "OK" stayed "OK" after its expiry date passed. Every API response now recalculates it from the expiry date.
- `POST` passed the raw request body to the database (a caller could set `status` or `_id`). Now only whitelisted fields are copied.
- A malformed id gave a 500, and a duplicate serial number was not handled. Now 400 and 409. Serial numbers are unique when present.
- Day-boundary maths used the server's local midnight on a UTC date, which can be off by a day. Dates are now compared as calendar days.

**Status rule (needs your confirmation, see summary):** expired = date has passed; overdue = expires today; due soon = within 30 days; OK = more than 30 days. The design document lists the four statuses but gives no day counts.

### [backend/src/utils/statusCalculator.ts]
**Status:** Created
**Phase:** Phase 3
**Pattern:** Strategy
**What it does:** `calculateEquipmentStatus(expiryDate, strategy?)`. The default strategy (`standardStatusStrategy`) turns "days until expiry" into a status. Another rule can be passed in without touching the model or controller, and tests can pass a fake one.
**Why structured this way:** AGENT_RULES asks for the Strategy pattern here. The model hook, the JSON output and (in Phase 5) the notification job all use the same function, so there is one source of truth.

### [backend/src/models/Equipment.ts]
**Status:** Rewritten
**Phase:** Phase 3
**What it does:** Same fields as before, with length limits, a unique sparse `serialNumber`, the shared type list `EQUIPMENT_TYPES`, and a `toJSON` that recalculates status on every response.

### [backend/src/services/equipmentService.ts], [controllers/equipmentController.ts], [routes/equipmentRoutes.ts], [utils/validation.ts]
**Status:** Created / Rewritten
**Phase:** Phase 3
**Pattern:** Service layer (the Repository pattern goes behind this in Phase 7)
**What it does:** The five endpoints. Controllers only read the request and send the response; the service holds the rules (whitelisting, "find then save so the hook runs", creator recorded as owner). Routes validate ids and fields. Reading needs a login; creating, changing and deleting need the manager role.
**Done check:** 30 API checks pass (201, 200, 204, 400, 401, 403, 404, 409, status recalculation, mass-assignment ignored, sorted list). Postman collection saved in `docs/postman/`.

### [frontend/src/utils/statusCalculator.ts], [utils/dateHelpers.ts], [services/equipmentApi.ts]
**Status:** Created / Rewritten
**Phase:** Phase 3
**Pattern:** Strategy (same rule as the server)
**What it does:** The device recalculates every item's status from its expiry date, so data cached while offline is never shown with an out-of-date status. Dates are read and shown in UTC so a picked day never shifts by one.

### [frontend/src/hooks/useEquipment.ts], [useEquipmentFilters.ts], [useEquipmentDashboard.ts], [useEquipmentForm.ts], [useEquipmentDetail.ts]
**Status:** Created
**Phase:** Phase 3
**What it does:** All data and behaviour for the equipment screens. `useEquipment` talks to the API, `useEquipmentFilters` does search, status filter and sorting, `useEquipmentDashboard` combines them with the state of the slide-over and delete dialog, `useEquipmentForm` handles validation and saving. Pages only lay things out.

### [frontend/src/components/equipment/*], [pages/manager/Dashboard.tsx], [pages/manager/EquipmentDetail.tsx]
**Status:** Created
**Phase:** Phase 3
**What it does:**
- `StatsCards`: one strip with four counts. Each cell is also a filter button.
- `EquipmentToolbar`: search box and status dropdown.
- `EquipmentTable` (tablet and desktop) with sortable columns and `aria-sort`; `EquipmentCard` (phones).
- `EquipmentFormSheet` + `EquipmentForm`: add and edit slide-over. Visible labels, errors on blur, loading button, server errors shown at the top.
- `DeleteEquipmentDialog`: confirmation with a red button.
- `EquipmentEmptyState`: two cases (nothing yet, nothing matches).
- `StatusBadge`: uppercase pill; "Expired" is the only solid-filled one.
**Key decisions:** Toasts moved to bottom-centre because bottom-right covered the Edit and Delete buttons of the last row. Managers land on `/equipment`; staff opening it are sent home by `ProtectedRoute roles={['manager']}`.
**Done check:** 33 checks in real Chrome (empty state, seeded data, stats, search, both filters, sorting, validation, add, edit with status change, cancel and confirm delete, detail page, staff redirect and hidden nav link, phone layout) plus zero console errors.

---

## Phase 4 — Feature 2: Offline Inspection Checklist

*(Entries will be added here as Phase 4 files are created)*

---

## Phase 5 — Push Notifications

*(Entries will be added here as Phase 5 files are created)*

---

## Phase 6 — Unit Testing & Troubleshooting

*(Entries will be added here as Phase 6 files are created)*

---

## Phase 7 — Design Pattern Refactor

*(Entries will be added here as Phase 7 files are created)*

---

## Phase 8 — Final Polish & Report

*(Entries will be added here as Phase 8 is completed)*

---

## 📌 Template for New Entries

Copy and paste this template every time a new file is created:

```markdown
### [frontend/src/path/to/file.ts]
**Status:** Created
**Phase:** Phase X — Name
**Pattern:** Pattern Name (or "None")
**What it does:**
Plain English description of what this file contains and what it does.

**Why structured this way:**
Explain the reasoning behind the structure chosen.

**Key decisions:**
- Decision 1 and why
- Decision 2 and why
```

---

*Changelog started: November 2026 | Will grow with every file created*

