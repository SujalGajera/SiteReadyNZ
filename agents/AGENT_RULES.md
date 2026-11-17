# 🤖 Agent Rules — SiteReady NZ
### IA730001 Advanced Application Development | Block 4, 2026
### Student: Sujal | Bachelor of Information Technology (BIT)

> **READ THIS FILE FIRST** before every session. These are the non-negotiable rules I operate by for this project.

---

## 📋 Project At a Glance

| Property | Value |
|---|---|
| **App Name** | SiteReady NZ |
| **Type** | Progressive Web Application (PWA) |
| **Stack** | React (Vite) + Node.js/Express + MongoDB |
| **Auth** | JWT + Google OAuth 2.0 |
| **Styling** | Tailwind CSS + ShadCN UI |
| **Animation** | Framer Motion (Emil Kowalski principles) |
| **Testing** | Jest + React Testing Library + Postman |
| **Push** | Web Push API (VAPID keys) |
| **Offline** | Service Workers + IndexedDB (Workbox) |
| **Submission Deadline** | Week 12, November 2026 |

---

## 🗂️ Canonical Folder Structure

```
siteready-nz/
├── agents/                        ← Agent rules & changelog (this folder)
│   ├── AGENT_RULES.md             ← This file — read first every session
│   └── CHANGELOG.md               ← File-by-file build log
│
├── frontend/                      ← React Vite PWA
│   ├── public/
│   │   ├── manifest.json          ← PWA manifest
│   │   └── icons/                 ← App icons (192, 512px)
│   ├── src/
│   │   ├── assets/                ← Static images, SVGs
│   │   ├── components/
│   │   │   ├── ui/                ← ShadCN base components (Button, Badge, Card, etc.)
│   │   │   ├── layout/            ← AppShell, Sidebar, Navbar, OfflineBanner
│   │   │   ├── equipment/         ← Feature-specific: EquipmentCard, EquipmentForm, StatusBadge
│   │   │   └── inspection/        ← ChecklistForm, ChecklistItem, SyncToast
│   │   ├── pages/
│   │   │   ├── auth/              ← Login.tsx, Register.tsx
│   │   │   ├── manager/           ← Dashboard.tsx, EquipmentDetail.tsx
│   │   │   └── staff/             ← InspectionList.tsx, ChecklistView.tsx
│   │   ├── hooks/                 ← useOfflineSync, useAuth, usePushNotifications
│   │   ├── context/               ← AuthContext, OfflineContext
│   │   ├── services/              ← api.ts (Axios instance), pushService.ts, indexedDB.ts
│   │   ├── utils/                 ← validators.ts, dateHelpers.ts, statusCalculator.ts
│   │   ├── types/                 ← TypeScript interfaces (Equipment, Inspection, User)
│   │   ├── sw/                    ← Service worker logic (sw.ts, workbox config)
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                       ← Node.js / Express REST API
│   ├── src/
│   │   ├── config/                ← db.ts (MongoDB connect), vapid.ts, passport.ts
│   │   ├── controllers/           ← authController.ts, equipmentController.ts, inspectionController.ts, pushController.ts
│   │   ├── middleware/            ← authMiddleware.ts, roleGuard.ts, errorHandler.ts, logger.ts
│   │   ├── models/                ← User.ts, Equipment.ts, Inspection.ts, PushSubscription.ts
│   │   ├── routes/                ← authRoutes.ts, equipmentRoutes.ts, inspectionRoutes.ts, pushRoutes.ts
│   │   ├── services/              ← pushService.ts, syncService.ts
│   │   ├── utils/                 ← jwtHelper.ts, validators.ts
│   │   └── app.ts                 ← Express app bootstrap
│   ├── server.ts                  ← Entry point
│   ├── .env.example
│   └── package.json
│
└── docs/                          ← Report screenshots, Postman exports
    ├── postman/
    └── screenshots/
```

---

## 🏗️ Development Phases

Work through these phases **in order**. Do not jump ahead. Each phase has clear done criteria.

### Phase 1 — Project Bootstrap & Config
- [x] Scaffold frontend: `npm create vite@latest frontend -- --template react-ts`
- [x] Install Tailwind CSS, ShadCN UI, Framer Motion
- [x] Scaffold backend: Express + TypeScript + Mongoose
- [x] Setup `.env` files for both
- [x] Configure service worker (Workbox via vite-plugin-pwa)
- [x] Setup PWA manifest.json
- **Done when:** Both dev servers start cleanly. Service worker registers in DevTools. 

### Phase 2 — Auth System
- [x] MongoDB User model (name, email, passwordHash, role, googleId)
- [x] POST /auth/register + POST /auth/login (JWT)
- [ ] Google OAuth 2.0 (Passport.js) (built and tested up to the Google redirect; needs your Google keys for a live test)
- [x] AuthContext in React (persist JWT in httpOnly cookie or localStorage)
- [x] Protected routes (manager vs staff guards)
- [x] Login + Register pages
- **Done when:** Can register, login with email/password and with Google. JWT returned and stored. Protected routes redirect unauthenticated users.

### Phase 3 — Feature 1: Equipment Management (Manager)
- [x] MongoDB Equipment model
- [x] All 5 REST endpoints: POST, GET all, GET one, PUT, DELETE /api/equipment
- [x] Equipment Dashboard page (filterable table, search, status badges)
- [x] Add/Edit Equipment slide-over form with validation
- [x] Status calculator (OK / Due Soon / Overdue / Expired logic)
- [x] Stats cards (total, due, overdue counts)
- [ ] Postman tested — all endpoints return correct status codes (collection ready in docs/postman; screenshots are yours to capture)
- **Done when:** Manager can fully CRUD equipment. Status auto-calculates from expiry date. Postman screenshots captured.

### Phase 4 — Feature 2: Offline Inspection Checklist (Staff)
- [ ] MongoDB Inspection model (with items array, syncStatus)
- [ ] GET /api/inspections/assigned/:userId
- [ ] POST /api/inspections/submit
- [ ] PATCH /api/inspections/:id/sync
- [ ] Service worker caches checklist data on load
- [ ] IndexedDB outbox queue (save offline submissions)
- [ ] Background Sync when connectivity returns
- [ ] Offline indicator banner
- [ ] Pass/Fail/Flag toggle UI with large touch targets
- **Done when:** Staff can complete checklist offline. Submission saves to IndexedDB. Syncs automatically on reconnect. Browser DevTools shows cache + IndexedDB entries.

### Phase 5 — Push Notifications
- [ ] Generate VAPID keys (web-push CLI)
- [ ] POST /api/push/subscribe (store subscription in DB)
- [ ] POST /api/push/send (trigger from manager or cron)
- [ ] Frontend: request notification permission, subscribe to push
- [ ] Manager overdue notification (triggered after 24h)
- [ ] Staff reminder notification (24h before due)
- **Done when:** Postman can trigger a push. Browser receives notification. VAPID keys stored in .env.

### Phase 6 — Unit Testing + Troubleshooting
- [ ] Jest setup on both frontend and backend
- [ ] Frontend: test critical components (StatusBadge, ChecklistItem, validators)
- [ ] Backend: test controller functions (equipment CRUD, auth)
- [ ] Add error logging middleware (Morgan + Winston or Pino)
- [ ] Debug session with VS Code variable watchers — screenshot captured
- **Done when:** `npm test` passes on both. At least 5 meaningful assertions per feature. Debug screenshot captured.

### Phase 7 — Design Pattern Refactor
- [ ] Apply **Repository Pattern** to data access layer (backend)
- [ ] Apply **Context/Provider Pattern** to React state (frontend)
- [ ] Apply **Strategy Pattern** to status calculation logic
- [ ] Apply **Observer Pattern** to sync events
- [ ] Code comments updated to reflect patterns
- **Done when:** Each pattern is documented in CHANGELOG with context explanation.

### Phase 8 — Report & Final Polish
- [ ] All screenshots captured per design document plan (12 screenshots minimum)
- [ ] Final report written with explanations
- [ ] GitHub repo URL ready
- [ ] Code zipped as `<StudentID>-<Name>.zip`
- **Done when:** ZIP uploaded to Moodle. Report submitted.

---

## ⚙️ Coding Rules (Non-Negotiable)

### General
1. **TypeScript everywhere** — no `any` types unless absolutely unavoidable. Always type props, API responses, and DB models.
2. **Comment every non-obvious line** in plain, clear English. Comments explain *why*, not just *what*.
3. **No dead code** — if something is removed, delete it. No commented-out blocks left in the final version.
4. **Meaningful names** — variables, functions, files. `getUserById` not `gub`. `EquipmentCard` not `Card1`.
5. **One job per function** — if a function does two things, split it into two functions.
6. **Error handling everywhere** — no uncaught promises. Every async function has try/catch with a meaningful error message.

### Frontend Rules
7. **Component size limit** — if a component exceeds ~150 lines, split it into sub-components.
8. **Custom hooks for logic** — business logic (fetching, syncing, auth checks) lives in `/hooks`, never inline in a component.
9. **ShadCN components first** — always check if ShadCN has the component before building from scratch. Only build custom if ShadCN doesn't cover it.
10. **Tailwind utility classes only** — no inline `style={}` attributes. No separate CSS files unless absolutely needed (e.g., keyframe animations not in Tailwind).
11. **Responsive by default** — mobile-first. Every layout works on 375px wide screen up.

### Backend Rules
12. **Controllers thin, services thick** — controllers handle HTTP in/out only. Business logic goes in `/services`.
13. **Validation at every boundary** — validate request bodies before hitting the database. Use express-validator or Zod.
14. **Never expose passwords or secrets** — passwordHash never returned in API responses. VAPID private key never in frontend code.
15. **HTTP status codes correct** — 201 for create, 200 for read/update, 204 for delete, 400 for bad request, 401 for unauth, 403 for forbidden, 404 for not found.

### Git Rules
16. **Commit after every phase** — commit message format: `feat(phase-X): short description`
17. **Never commit `.env` files** — `.env.example` with dummy values only.

---

## 🎨 UI / UX Design Rules

> Think like an Apple designer + Emil Kowalski. Every interaction should feel **intentional, smooth, and inevitable**.

### Visual Language
- **Colour palette:** Neutral base (zinc/slate grays), one strong accent (emerald green — safety brand), semantic status colours: `green` OK, `amber` Due Soon, `red` Overdue/Expired
- **Typography:** System font stack (SF Pro on Mac/iOS, Segoe on Windows) or Inter (Google Fonts). No decorative fonts.
- **Spacing:** 4px base unit. Use Tailwind spacing scale consistently (p-4, gap-6, etc.).
- **Border radius:** Rounded but not bubbly — `rounded-lg` (8px) for cards, `rounded-md` (6px) for inputs, `rounded-full` for badges.
- **Shadows:** Subtle. `shadow-sm` for cards at rest. `shadow-md` on hover. Never heavy drop shadows.
- **Iconography:** Lucide Icons (ships with ShadCN) only. Consistent 20px or 24px size. Never mix icon libraries.

### Motion Rules (Emil Kowalski Principles)
- **Ask before animating:** Every animation must have a clear purpose. If in doubt, don't animate.
- **Fast UI:** Routine actions (button click, tab switch) → no animation or < 150ms.
- **Transitions:** Page transitions, modals, slide-overs → 200–300ms with custom ease: `cubic-bezier(0.16, 1, 0.3, 1)` (snappy spring out).
- **Feedback animations:** Form submit, sync complete, toast appear → Framer Motion `AnimatePresence` with `initial`, `animate`, `exit`.
- **Drag/gesture:** Use `Vaul` (Emil's drawer library) for mobile bottom sheets / drawers.
- **Toast:** Use `Sonner` (Emil's toast library) — not a custom-built toast.
- **Only animate:** `transform`, `opacity`. Never animate `width`, `height`, `top`, `left` (causes layout shift).
- **Offline banner:** Slide down from top, persistent amber colour, no dismiss button (goes away automatically when online).

### Component Patterns
- **Status badges** are always uppercase, tight letter-spacing, pill shaped with coloured background.
- **Data tables** always have: search input, status filter dropdown, column sort, empty state illustration.
- **Forms** always have: visible labels (never placeholder-only), inline validation on blur, loading state on submit button.
- **Destructive actions** (delete) always have: confirmation dialog with red confirm button.
- **Minimum touch target** for mobile: 44×44px (critical for checklist Pass/Fail/Flag toggles).

---

## 🔒 Security Checklist (20 marks — cannot lose points here)

- [ ] Passwords hashed with bcrypt (salt rounds ≥ 12)
- [ ] JWT signed with strong secret, expires in 7d
- [ ] JWT not accessible to JavaScript (httpOnly cookie preferred)
- [ ] Google OAuth 2.0 state parameter validated (CSRF protection)
- [ ] All API routes (except /auth) require valid JWT
- [ ] Role guard middleware: manager-only routes reject staff JWT
- [ ] MongoDB queries use parameterised values only (Mongoose handles this — do not use `$where` with user input)
- [ ] VAPID private key in `.env` only, never in frontend
- [ ] CORS configured for specific origin (not `*`) in production
- [ ] `.env` in `.gitignore`

---

## 🧪 Testing Checklist (10 marks)

- [ ] At least 5 frontend unit tests (meaningful values, not just "it renders")
- [ ] At least 5 backend unit tests (controller logic or service logic)
- [ ] All Postman requests documented with screenshots
  - POST /auth/register → 201
  - POST /auth/login → 200 with JWT
  - POST /api/equipment → 201
  - GET /api/equipment → 200 with array
  - PUT /api/equipment/:id → 200
  - DELETE /api/equipment/:id → 204
  - POST /api/push/send → 200
- [ ] Debug session screenshot (VS Code with variable watchers active)

---

## 🏆 Marks Allocation (Quick Reference)

| Task | Marks |
|---|---|
| Project Setup & Config | 5 |
| Frontend UI/UX (2 features × 5) | 10 |
| Auth (JWT + Google OAuth) | 10 |
| Backend CRUD + Postman | 10 |
| Push Notifications | 10 |
| Design Patterns + Code Quality | 10 |
| Unit Testing + Troubleshooting | 10 |
| Design Phase Report | 10 |
| Implementation Report | 10 |
| Code Defence / Viva | 10 |
| **Bonus: DB Replication/Scaling** | +5 |
| **TOTAL** | **100 (+5)** |

---

## 📐 Design Patterns Applied (10 marks — with justification)

| Pattern | Where Applied | Why |
|---|---|---|
| **Repository Pattern** | Backend data layer (`/services`) | Decouples business logic from Mongoose. Makes unit testing easy — mock the repo, not the DB. Enables swapping DB without changing controllers. |
| **Context/Provider Pattern** | `AuthContext`, `OfflineContext` | React's native pattern for shared state. Avoids prop drilling through 3+ component levels. Scales cleanly as app grows. |
| **Strategy Pattern** | `statusCalculator.ts` utility | Equipment status (OK/Due Soon/Overdue/Expired) is a calculation that might change. Strategy lets us swap the algorithm without changing the component that uses it. |
| **Observer Pattern** | Offline sync via Service Worker events | The sync event fires when connectivity returns. Components observe `OfflineContext` state and react. Decoupled — the uploader doesn't know who is watching. |
| **Singleton Pattern** | Axios instance in `services/api.ts` | One configured HTTP client shared across the app. Auth headers injected once at the interceptor level, not in every request. |

---

## 🚨 Common Pitfalls to Avoid

1. **Don't use `useEffect` for data fetching directly in pages** — use a custom hook like `useEquipment()` instead.
2. **Don't store JWT in `localStorage` for security-sensitive apps** — prefer httpOnly cookies. Document this choice.
3. **Don't cache all API responses in Service Worker** — cache only GET requests for offline-needed data. POST/PUT/DELETE must go to IndexedDB outbox.
4. **Don't forget to handle the case where push permission is denied** — graceful degradation, not a crash.
5. **Don't skip error boundaries** — wrap the app root with a React `<ErrorBoundary>` component.
6. **Don't forget offline sync feedback** — user must see a toast/indicator when sync completes.
7. **Don't forget the empty state** — every list/table needs an empty state design (not just a blank screen).

---

## 📸 Screenshots Required for Report

Capture these **in order** as development progresses:

1. `setup-01-vite-create.png` — Terminal showing `npm create vite@latest`
2. `setup-02-sw-register.png` — Browser DevTools > Application > Service Workers
3. `frontend-01-dashboard.png` — Equipment Dashboard with data
4. `frontend-02-form-validation.png` — Add Equipment form with validation errors visible
5. `frontend-03-checklist-offline.png` — Checklist screen with offline banner
6. `frontend-04-indexeddb.png` — DevTools > Application > IndexedDB with outbox data
7. `postman-01-create.png` — POST /api/equipment → 201
8. `postman-02-list.png` — GET /api/equipment → 200 with JWT header
9. `mongodb-01-atlas.png` — MongoDB Atlas showing inspection document
10. `push-01-notification.png` — Push notification received in browser
11. `test-01-jest-pass.png` — Terminal showing all tests passing
12. `debug-01-watchers.png` — VS Code debugger with variable watchers active

---

*Last updated: November 2026 | Version 1.0*

