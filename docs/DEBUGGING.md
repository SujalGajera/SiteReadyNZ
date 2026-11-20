# How to take the debug screenshot (variable watchers)

The rubric asks for "screenshots of debugging (add watchers for variables)". This takes about five minutes.
The launch settings are already in `.vscode/launch.json`.

## Option A (easiest): pause inside a real function while a test runs

This needs no servers and no database.

1. In VS Code open **`backend/src/tests/inspectionService.test.ts`**. Leave it as the active tab.
2. Open **`backend/src/services/inspectionService.ts`** in a second tab and click in the grey space left of
   line numbers to set a **red breakpoint** on these lines:
   - the line `const answers = new Map(...)` (about line 102)
   - the line `const completedAt = chooseCompletedAt(...)` (about line 123)
3. Go back to the test file tab. Press **F5**, and choose **"Debug the open backend test file"**.
4. VS Code pauses on the first breakpoint. In the left **Run and Debug** panel you now see **Variables**, **Watch**,
   **Call Stack** and **Breakpoints**.
5. In the **Watch** panel click **+** and add these one by one:
   - `input.submissionId`
   - `inspection.status`
   - `caller.role`
   - `input.items.length`
   - `answers.size` (after you press F10 once, so that line has run)
6. Press **F10** (step over) a few times and watch the values change. When `checkedItems` exists, add it to the watch too.
7. Take the screenshot while paused with the yellow line highlighted. It should show the code, the Watch values and the Call Stack.
   Save it as **`debug-01-watchers.png`** in `docs/screenshots/`.

## Option B: pause inside the live API

1. Press **F5** and choose **"Debug the API (backend)"** (MongoDB must be running).
2. Set a breakpoint in `backend/src/controllers/authController.ts` on the first line inside `login`.
3. In Postman send **POST /auth/login**. VS Code pauses. Add watchers `req.body.email` and `user.role` and step through.

## What to say in the report

- A breakpoint stops the program on one line, so you can read what each variable really holds at that moment.
- Watchers keep an eye on the values you care about while you step line by line (F10).
- Example finding to describe: with `answers.size` in the Watch panel you can see that an unknown question id sent
  by a phone is never added to the map of answers, because the server only trusts the questions it stored itself.

## Error handling evidence to screenshot as well

| What | How to show it |
|---|---|
| Logger output on screen | Run `npm run dev` in `backend`, sign in with a wrong password; the terminal shows a `warn` line and an `http` line |
| Logger files | Open `backend/logs/combined.log` and `backend/logs/error.log` in VS Code |
| Friendly error in the app | Sign in with a wrong password; the red message appears |
| Offline handling | Browser DevTools > Network > Offline; the amber "You are offline" banner appears |
| Error boundary | See `frontend/src/components/ErrorBoundary.tsx` (shows "Something went wrong" instead of a blank page) |
| Postman error codes | 400, 401, 403, 404, 409 requests in the collection |
