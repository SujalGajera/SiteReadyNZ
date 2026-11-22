# Postman collections for SiteReady NZ

Two collections and one environment. All were run with Newman against the live API before they were saved.

| File | What it is |
|---|---|
| `SiteReady-NZ.postman_collection.json` | The full test run: 55 requests in 7 folders, 163 checks. Creates its own accounts, so it needs no setup. |
| `SiteReady-NZ.postman_environment.json` | One setting, `baseUrl = http://localhost:5000`. |
| `SiteReady-NZ-demo-data.postman_collection.json` | Fills **your own** account with sample data, so the app looks busy for screenshots. |

## Run the full collection in Postman (2 minutes)

1. Start MongoDB, then in `backend` run `npm run dev`. Wait for "Connected to MongoDB successfully".
2. In Postman choose **Import** and drop in both files named `SiteReady-NZ.postman_collection.json` and
   `SiteReady-NZ.postman_environment.json`.
3. Top right, choose the environment **SiteReady NZ (local)**.
4. Right-click the collection, choose **Run collection**, then **Run**.
5. Every request has a green tick when its checks pass. Open any request and look at the **Test Results** tab for the
   screenshots in the report.

To run it again straight away, just click Run again. Each run makes new accounts, so runs never clash.

> Sign-in and sign-up allow 20 attempts per 15 minutes. One full run uses 10, so you can run it twice in a row.
> If you see **429**, restart the API (`Ctrl+C`, then `npm run dev`) or wait 15 minutes.

## What the 7 folders show

| Folder | What it proves |
|---|---|
| 1. Auth | Register (201), login (200 with a JWT), who am I (200). The password hash is never sent back. |
| 2. Staff | A manager creates staff (201), lists them, and the staff member signs in. |
| 3. Equipment | Full create, read, update, delete (201, 200, 200, 204, then 404). The server works out the status itself. |
| 4. Inspections | Assign (201), staff list (200), submit (200), the same upload twice is safe (200), a different upload is refused (409), sync (200), delete an open check (204), a finished check is kept (409). |
| 5. Push notifications | Public key (200), subscribe (200), an unsafe address is refused (400), send (200), run checks (200), unsubscribe (204). |
| 6. Error codes and attack attempts | 400, 401, 403, 404 and 409, plus NoSQL-injection attempts that must be refused. |
| 7. Delete equipment, sign out | Deleting equipment removes its open checks, keeps finished ones as history, then logs out (204). |

## Run it from the command line (no Postman needed)

```
cd backend/src/postman
npx newman run SiteReady-NZ.postman_collection.json -e SiteReady-NZ.postman_environment.json
```

## Fill your own account with demo data

1. In the app, sign up as a manager at `http://localhost:5173/register`.
2. In Postman import `SiteReady-NZ-demo-data.postman_collection.json`, open the collection, then the **Variables** tab.
3. Type your email into `demoEmail` and your password into `demoPassword`, and click **Save**.
4. Run the collection (11 requests). It adds a staff member, four pieces of equipment (one in each status: Ready, Due
   soon, Check overdue, Expired) and two checks for the staff member (one due today, one 3 days late).
5. Refresh the app. Staff sign in with `tane.walker@example.com` and `correct-horse-battery`.
6. Requests 10 and 11 send push notifications. They only reach a device that has turned reminders on in Chrome first.

## How the scripts work (for the viva)

- **Collection pre-request script:** works out today's date and other dates, and clears Postman's cookie jar, so every
  request is judged only by the `Authorization` header it carries.
- **Test scripts:** each request checks its status code and the important parts of the answer, using `pm.test`.
- **Saved values:** `managerToken`, `staffToken`, `equipmentId`, `inspectionId` and so on are saved by one request and
  used by the next, so the requests must run in order.
- **Why the header wins over the cookie:** the server reads `Authorization: Bearer ...` before the login cookie. That is
  what lets Postman switch between a manager and a staff member without logging out.
