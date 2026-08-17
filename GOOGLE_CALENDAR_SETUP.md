# ORÁ — "All Appointments" Google Calendar

One Google calendar, owned by **admin@orasuites.com**, showing **every** ORÁ appointment —
all practitioners, all 55 service calendars — so the whole clinic day is visible in Google
Calendar and on your phone.

This is separate from any per-practitioner Google sync inside GHL. It is a one-way mirror:
**GHL is the source of truth. Edit bookings in GHL, never in Google.**

---

## What this does

| Trigger | What happens |
|---|---|
| Someone books on orasuites.com | The appointment appears in the Google calendar within a second or two |
| Someone books/reschedules/cancels **inside GHL** (phone, walk-in, practitioner) | Picked up by the nightly reconcile at **03:00 UK** |
| An appointment is cancelled or deleted in GHL | Its Google event is removed |
| Google is down or disconnected | Bookings still work perfectly. Nothing breaks. The mirror catches up on the next reconcile |

The reconciler looks at **now → +90 days** and makes Google match GHL exactly.
It only ever touches events it created itself (they carry a hidden `oraManaged=1` tag),
so anything you add to that calendar by hand is safe.

---

## Setup — run once

### Step 1 — connect the Google account

From the repo root:

```bash
cd "/Users/abdulafolabi/Desktop/SPIDXR NETWORK/CLIENTS/Ora clinic/Ora-Suites"
node script/google-connect.mjs
```

**What you'll see:**

1. It finds the Google OAuth client automatically in the `admin setup` folder next to this
   repo. (That file is only ever *read* — it is never copied into the repo or committed.)
2. It prints a long `https://accounts.google.com/…` URL and tries to open your browser.
3. **Sign in as `admin@orasuites.com`** — this matters. Whichever account you pick is the
   account that will own the calendar.
4. Google will warn: *"Google hasn't verified this app."* That's expected for an internal
   Desktop client. Click **Advanced → Go to ora-claude (unsafe)**.
5. Tick the calendar permission → **Continue**.
6. The browser shows a cream "Calendar connected" card. Go back to the terminal.
7. The script creates the calendar **"ORÁ — All Appointments"** (or reuses it if it already
   exists) and writes four values into `.env`:
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`.
   It also generates a `CRON_SECRET` if you don't have one.

Nothing secret is ever printed on screen. `.env` is gitignored (`.env*`) — verified.

**Safe to re-run** any time (e.g. if the token is ever revoked). It reuses the same
calendar and just refreshes the credentials.

Useful flags:

```bash
node script/google-connect.mjs --dry-run                  # do everything except write .env
node script/google-connect.mjs --port 53690               # if 53682 is busy
node script/google-connect.mjs --secret-file /path/to.json  # explicit OAuth client
```

---

### Step 2 — push the same values to Vercel

Each command reads the value straight out of `.env` and pipes it in, so nothing appears on
screen. Run all five from the repo root:

```bash
grep '^GOOGLE_CLIENT_ID=' .env     | cut -d= -f2- | tr -d '\n' | npx vercel env add GOOGLE_CLIENT_ID production
grep '^GOOGLE_CLIENT_SECRET=' .env | cut -d= -f2- | tr -d '\n' | npx vercel env add GOOGLE_CLIENT_SECRET production
grep '^GOOGLE_REFRESH_TOKEN=' .env | cut -d= -f2- | tr -d '\n' | npx vercel env add GOOGLE_REFRESH_TOKEN production
grep '^GOOGLE_CALENDAR_ID=' .env   | cut -d= -f2- | tr -d '\n' | npx vercel env add GOOGLE_CALENDAR_ID production
grep '^CRON_SECRET=' .env          | cut -d= -f2- | tr -d '\n' | npx vercel env add CRON_SECRET production
```

(If you'd rather paste by hand, `npx vercel env add GOOGLE_CLIENT_ID production` prompts for
the value — copy it out of `.env`.)

Then check they landed:

```bash
npx vercel env ls production | grep -E 'GOOGLE_|CRON_SECRET'
```

---

### Step 3 — deploy

```bash
npm run deploy
```

That's the existing gated deploy: type-check → preview → health check → promote → verify
production, with automatic rollback if production comes back unhealthy.

---

### Step 4 — backfill the next 90 days

The nightly cron will do this on its own at 03:00, but to see the calendar populate now:

```bash
curl -s -H "x-cron-key: $(grep '^CRON_SECRET=' .env | cut -d= -f2-)" \
  https://www.orasuites.com/api/cron/sync-calendar
```

You'll get JSON back like:

```json
{ "ok": true, "practitioners": 5, "ghlAppointments": 41,
  "created": 41, "updated": 0, "deleted": 0, "failed": 0, "durationMs": 8123 }
```

---

### Step 5 — see it on your phone

1. Open Google Calendar signed in as **admin@orasuites.com**.
2. **ORÁ — All Appointments** is in the left sidebar.
3. To view it from your personal Google account: hover the calendar → **⋮ → Settings and
   sharing → Share with specific people → Add** your own address with **"See all event
   details"**. Accept the invite, and it shows up in the Google Calendar app on your phone.

---

## Verifying it works

```bash
npm run health
```

Look for `checks.googleCalendar`:

| Value | Meaning |
|---|---|
| `{ "ok": true, "detail": "not connected — optional" }` | Env vars absent. Everything else still works — this never fails health. |
| `{ "ok": true, "detail": "connected — \"ORÁ — All Appointments\"" }` | Working. |
| `{ "ok": false, "detail": "HTTP 401" }` | Refresh token revoked → re-run `node script/google-connect.mjs`. |
| `{ "ok": false, "detail": "HTTP 404" }` | Calendar was deleted in Google → re-run the connect script; it will recreate it. |

End-to-end test: make a real booking on the site, then check Google. The event should read
`<Service> — <Client name>`, with the practitioner, client email/phone, notes and the GHL
appointment id in the description, located at *ORÁ Suites, 49 Deansgate, Manchester M3 2AY*.
Aesthetics appointments are tangerine, nails are banana.

---

## How it's built

| File | Role |
|---|---|
| `script/google-connect.mjs` | One-time local consent helper (Step 1). Never runs in production. |
| `api/_lib/google-calendar.ts` | The mirror: token refresh, `upsertEvent`, `deleteEvent`, `listManagedEvents`. Silent no-op without the env vars. |
| `server/google-calendar.ts` | Express-side re-export so both backends share one implementation (same pattern as `server/ghl-notify.ts`). |
| `api/ghl/booking.ts` · `server/routes.ts` | Mirror a booking right after GHL confirms it. Non-blocking — a Google failure can never fail a customer's booking. |
| `api/cron/sync-calendar.ts` | Nightly reconciler. Secret-protected. Idempotent. |
| `api/health.ts` | Adds the optional `googleCalendar` check. |
| `vercel.json` | `crons: [{ path: "/api/cron/sync-calendar", schedule: "0 3 * * *" }]` |

**No new dependencies.** `googleapis` isn't installed, so the Calendar v3 REST API is called
directly with `fetch` and a refresh-token grant.

**Idempotency.** Every mirrored event stores the GHL appointment id in
`extendedProperties.private.ghlId`; upserts look it up with
`privateExtendedProperty=ghlId=<id>` first, so re-running never duplicates anything.

**Privacy.** Mirrored events have **no attendees** — creating them never emails a client.

---

## Security notes

- `CRON_SECRET` is required. Without it, `/api/cron/sync-calendar` returns **503 and refuses
  to run** rather than exposing an unauthenticated write path. With it, the endpoint accepts
  `x-cron-key: <secret>` or Vercel Cron's `authorization: Bearer <secret>`; anything else is
  **401**.
- The Google OAuth client JSON stays in `admin setup/`, outside the repo. Never commit it.
- `.env` and `.env.local` are gitignored via `.env*`, and no env file is tracked by git.
- The refresh token grants full calendar access to `admin@orasuites.com`. To revoke:
  [myaccount.google.com/permissions](https://myaccount.google.com/permissions) → remove
  **ora-claude**, then re-run the connect script to reissue.

---

## Common issues

| Symptom | Cause / fix |
|---|---|
| `Could not find the Google OAuth client JSON` | The `admin setup` folder moved. Pass `--secret-file '/full/path/client_secret_….json'`. |
| `ports 53682–53691 are all in use` | Pass `--port 54000`. |
| `Google returned no refresh token` | The app was already authorised without `prompt=consent`. Revoke at myaccount.google.com/permissions and re-run. |
| Browser shows `redirect_uri_mismatch` | The OAuth client must be **Desktop app** type. Desktop clients accept any `http://localhost:<port>`; Web clients don't. |
| Events appear but no client email/phone | The cron enriches from GHL contacts and caps at 200 lookups per run to stay inside the function timeout. `contactLookupsCapped: true` in the response means some were skipped — they fill in on the next run. |
| Notes missing on cron-synced events | GHL's `/calendars/events` list endpoint doesn't return `notes` (only the booking path has them). Expected. |
| Cron never fires | **Vercel Hobby plans only allow one cron, running once per day.** The schedule is `0 3 * * *` (03:00 UTC), which is compliant. On Hobby, Vercel may also run it within a window rather than exactly on the hour. |
| Duplicate events | Shouldn't happen — the `ghlId` lookup prevents it. If you see one, it was created by hand or by GHL's own per-practitioner Google sync into the *same* calendar. Keep GHL's practitioner sync pointed at separate calendars. |

---

*Last updated: 2026-08-17 — built by SPIDXR. GHL event/contact shapes verified against the live location the same day.*
