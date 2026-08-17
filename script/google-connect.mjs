#!/usr/bin/env node
/**
 * ORÁ Suites — one-time Google Calendar connect helper.  RUN THIS LOCALLY.
 *
 *   node script/google-connect.mjs
 *
 * What it does:
 *   1. reads the Google OAuth **Desktop** client (never copied into the repo)
 *   2. opens Google's consent screen for the clinic admin account
 *      (admin@orasuites.com) and captures the code on a localhost listener
 *   3. exchanges it for a long-lived REFRESH TOKEN
 *   4. finds — or creates — the calendar "ORÁ — All Appointments"
 *   5. writes GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN /
 *      GOOGLE_CALENDAR_ID (and a CRON_SECRET, if missing) into the repo `.env`
 *
 * Nothing secret is ever printed to the terminal — values go straight to
 * `.env`, which is gitignored (`.env*`).
 *
 * Safe to re-run: it reuses the existing calendar and simply refreshes the
 * stored credentials.
 *
 * Flags:
 *   --secret-file <path>   OAuth client JSON (default: auto-discovered, see below)
 *   --client-id <id> --client-secret <secret>   supply credentials directly
 *   --port <n>             localhost port for the callback (default 53682)
 *   --calendar-name <s>    override the calendar title
 *   --dry-run              do everything except writing .env
 */

import { createServer } from "node:http";
import { readFile, writeFile, readdir, access } from "node:fs/promises";
import { constants as FS } from "node:fs";
import { randomBytes, createHash } from "node:crypto";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = path.join(REPO_ROOT, ".env");
const SCOPE = "https://www.googleapis.com/auth/calendar";
const DEFAULT_CALENDAR_NAME = "ORÁ — All Appointments";
const TIMEZONE = "Europe/London";

/* ── tiny arg parser ─────────────────────────────────────── */
const argv = process.argv.slice(2);
const flag = (name, fallback = undefined) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
};
const has = (name) => argv.includes(`--${name}`);

const DRY_RUN = has("dry-run");
const CALENDAR_NAME = flag("calendar-name", DEFAULT_CALENDAR_NAME);
const BASE_PORT = Number(flag("port", "53682"));

/* ── pretty output ───────────────────────────────────────── */
const c = { dim: "\x1b[2m", b: "\x1b[1m", g: "\x1b[32m", y: "\x1b[33m", r: "\x1b[31m", x: "\x1b[0m" };
const step = (n, msg) => console.log(`\n${c.b}${n}${c.x} ${msg}`);
const ok = (msg) => console.log(`  ${c.g}✓${c.x} ${msg}`);
const warn = (msg) => console.log(`  ${c.y}!${c.x} ${msg}`);
const die = (msg) => {
  console.error(`\n${c.r}✖ ${msg}${c.x}\n`);
  process.exit(1);
};

/* ── 1. locate the OAuth client ──────────────────────────── */

async function loadClient() {
  const id = flag("client-id");
  const secret = flag("client-secret");
  if (id && secret) return { clientId: id, clientSecret: secret, from: "command line" };

  const candidates = [];
  const explicit = flag("secret-file") || process.env.GOOGLE_CLIENT_SECRET_FILE;
  if (explicit) candidates.push(explicit);

  // Default: the "admin setup" folder that sits beside this repo. The file is
  // deliberately kept OUTSIDE the repo and is only ever read, never copied in.
  const adminSetup = path.resolve(REPO_ROOT, "..", "admin setup");
  try {
    const files = await readdir(adminSetup);
    for (const f of files) {
      if (f.startsWith("client_secret_") && f.endsWith(".json")) candidates.push(path.join(adminSetup, f));
    }
  } catch {
    /* folder may not exist on another machine — that's fine */
  }

  for (const file of candidates) {
    try {
      await access(file, FS.R_OK);
      const json = JSON.parse(await readFile(file, "utf8"));
      const node = json.installed || json.web;
      if (!node?.client_id || !node?.client_secret) continue;
      if (!json.installed) warn("that OAuth client is a Web client; a Desktop client is recommended for this flow");
      return { clientId: node.client_id, clientSecret: node.client_secret, from: file };
    } catch {
      /* try the next candidate */
    }
  }

  die(
    "Could not find the Google OAuth client JSON.\n" +
      "  Pass it explicitly:  node script/google-connect.mjs --secret-file '/path/to/client_secret_….json'\n" +
      "  or:                  node script/google-connect.mjs --client-id <id> --client-secret <secret>",
  );
}

/* ── 2. loopback listener + consent ──────────────────────── */

function listen(port) {
  return new Promise((resolve, reject) => {
    let settle;
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      if (url.pathname !== "/") {
        res.writeHead(404).end();
        return;
      }
      const error = url.searchParams.get("error");
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const good = !error && code;
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        `<!doctype html><meta charset="utf-8"><title>ORÁ</title>` +
          `<body style="margin:0;background:#f4efe8;font-family:Georgia,serif;display:grid;place-items:center;height:100vh">` +
          `<div style="max-width:420px;padding:40px;background:#fffdf9;border:1px solid #e6dccf;border-radius:16px;text-align:center">` +
          `<p style="margin:0 0 8px;color:#b98867;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:.25em;text-transform:uppercase">ORÁ Suites</p>` +
          `<h1 style="margin:0 0 10px;font-weight:400;font-size:26px;color:#1a1008">${good ? "Calendar connected" : "Connection failed"}</h1>` +
          `<p style="margin:0;color:#8a7d72;font-family:Helvetica,Arial,sans-serif;font-size:15px">${
            good ? "You can close this tab and return to the terminal." : `Google said: ${error || "no authorisation code"}`
          }</p></div></body>`,
      );
      settle?.({ code, state, error });
      setTimeout(() => server.close(), 200);
    });
    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => {
      resolve({
        port,
        close: () => server.close(),
        waitForCode: () =>
          new Promise((res2, rej2) => {
            settle = ({ code, state, error }) => (error || !code ? rej2(new Error(error || "no code returned")) : res2({ code, state }));
            setTimeout(() => rej2(new Error("timed out after 5 minutes waiting for Google")), 5 * 60_000);
          }),
      });
    });
  });
}

async function listenWithFallback(base) {
  for (let p = base; p < base + 10; p++) {
    try {
      return await listen(p);
    } catch (err) {
      if (err?.code !== "EADDRINUSE") throw err;
    }
  }
  die(`ports ${base}–${base + 9} are all in use — pass --port <n>`);
}

function openBrowser(url) {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    spawn(cmd, [url], { stdio: "ignore", detached: true, shell: process.platform === "win32" }).unref();
    return true;
  } catch {
    return false;
  }
}

/* ── 3. token exchange ───────────────────────────────────── */

async function postForm(url, params) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

/* ── 4. Google Calendar helpers ──────────────────────────── */

async function gcal(accessToken, pathname, init = {}) {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${pathname}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

async function findOrCreateCalendar(accessToken, name) {
  let pageToken;
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams({ maxResults: "250", minAccessRole: "owner" });
    if (pageToken) qs.set("pageToken", pageToken);
    const list = await gcal(accessToken, `/users/me/calendarList?${qs}`);
    if (!list.ok) break;
    const hit = (list.body?.items || []).find((cal) => (cal.summary || "").trim() === name.trim());
    if (hit) return { id: hit.id, created: false };
    pageToken = list.body?.nextPageToken;
    if (!pageToken) break;
  }

  const created = await gcal(accessToken, "/calendars", {
    method: "POST",
    body: JSON.stringify({
      summary: name,
      description: "Every ORÁ Suites appointment from GoHighLevel — all practitioners, all services. Mirrored automatically; edit bookings in GHL.",
      timeZone: TIMEZONE,
    }),
  });
  if (!created.ok || !created.body?.id) {
    die(`could not create the calendar (HTTP ${created.status}): ${JSON.stringify(created.body).slice(0, 200)}`);
  }
  return { id: created.body.id, created: true };
}

/* ── 5. .env writing (idempotent, preserves everything else) ─ */

async function upsertEnv(updates) {
  let original = "";
  try {
    original = await readFile(ENV_PATH, "utf8");
  } catch {
    /* first run — .env will be created */
  }

  const lines = original.length ? original.replace(/\n+$/, "").split("\n") : [];
  const changed = [];
  const added = [];

  for (const [key, value] of Object.entries(updates)) {
    const idx = lines.findIndex((l) => new RegExp(`^\\s*(export\\s+)?${key}\\s*=`).test(l));
    if (idx !== -1) {
      if (lines[idx] !== `${key}=${value}`) changed.push(key);
      lines[idx] = `${key}=${value}`;
    } else {
      lines.push(`${key}=${value}`);
      added.push(key);
    }
  }

  if (!DRY_RUN) await writeFile(ENV_PATH, `${lines.join("\n")}\n`, { mode: 0o600 });
  return { changed, added };
}

async function existingEnvValue(key) {
  try {
    const text = await readFile(ENV_PATH, "utf8");
    const line = text.split("\n").find((l) => new RegExp(`^\\s*(export\\s+)?${key}\\s*=`).test(l));
    return line ? line.slice(line.indexOf("=") + 1).trim() : null;
  } catch {
    return null;
  }
}

/* ── main ────────────────────────────────────────────────── */

async function main() {
  console.log(`\n${c.b}ORÁ Suites — connect the "${CALENDAR_NAME}" Google calendar${c.x}`);
  console.log(`${c.dim}Sign in as the clinic admin account (admin@orasuites.com) when Google asks.${c.x}`);
  if (DRY_RUN) warn("--dry-run: .env will NOT be written");

  step("1/5", "Reading the Google OAuth client…");
  const { clientId, clientSecret, from } = await loadClient();
  ok(`client loaded from ${from === "command line" ? "the command line" : path.basename(from)} ${c.dim}(never copied into the repo)${c.x}`);

  step("2/5", "Starting the localhost listener…");
  const server = await listenWithFallback(BASE_PORT);
  const redirectUri = `http://localhost:${server.port}`;
  ok(`listening on ${redirectUri}`);

  // PKCE — recommended for installed apps.
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(16).toString("hex");

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPE,
      access_type: "offline",
      prompt: "consent", // forces a refresh_token even on a repeat run
      include_granted_scopes: "true",
      code_challenge: challenge,
      code_challenge_method: "S256",
      state,
    });

  step("3/5", "Waiting for you to approve access in the browser…");
  console.log(`\n  ${c.b}Open this URL and sign in as admin@orasuites.com:${c.x}\n`);
  console.log(`  ${authUrl}\n`);
  if (openBrowser(authUrl)) console.log(`  ${c.dim}(a browser tab should have opened automatically)${c.x}`);
  console.log(
    `  ${c.dim}If Google warns "Google hasn't verified this app": click Advanced → "Go to ora-claude (unsafe)".\n` +
      `  That warning is expected for an internal Desktop client. Tick the calendar permission, then Continue.${c.x}`,
  );

  let code;
  try {
    const result = await server.waitForCode();
    if (result.state !== state) die("state mismatch — aborting (possible CSRF). Re-run the script.");
    code = result.code;
  } catch (err) {
    server.close();
    die(`consent failed: ${err.message}`);
  }
  ok("authorisation received");

  step("4/5", "Exchanging the code for a refresh token…");
  const token = await postForm("https://oauth2.googleapis.com/token", {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    code_verifier: verifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  if (!token.ok || !token.body?.access_token) {
    die(`token exchange failed (HTTP ${token.status}): ${token.body?.error_description || token.body?.error || "unknown error"}`);
  }
  const accessToken = token.body.access_token;
  let refreshToken = token.body.refresh_token;
  if (!refreshToken) {
    refreshToken = await existingEnvValue("GOOGLE_REFRESH_TOKEN");
    if (refreshToken) warn("Google returned no new refresh token — keeping the one already in .env");
    else die("Google returned no refresh token. Revoke the app at myaccount.google.com/permissions and re-run.");
  }
  ok("refresh token obtained (not printed — it goes straight to .env)");

  step("5/5", `Finding or creating "${CALENDAR_NAME}"…`);
  const calendar = await findOrCreateCalendar(accessToken, CALENDAR_NAME);
  ok(calendar.created ? `calendar created ${c.dim}(${calendar.id})${c.x}` : `existing calendar reused ${c.dim}(${calendar.id})${c.x}`);

  const updates = {
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: clientSecret,
    GOOGLE_REFRESH_TOKEN: refreshToken,
    GOOGLE_CALENDAR_ID: calendar.id,
  };
  if (!(await existingEnvValue("CRON_SECRET"))) updates.CRON_SECRET = randomBytes(24).toString("hex");

  const { changed, added } = await upsertEnv(updates);
  ok(
    DRY_RUN
      ? "dry run — .env untouched"
      : `.env updated ${c.dim}(${added.length} added, ${changed.length} refreshed — gitignored via .env*)${c.x}`,
  );

  console.log(`\n${c.g}${c.b}Done.${c.x} The mirror is live locally.\n`);
  console.log(`${c.b}Next — push the same values to Vercel production (each command reads from .env, nothing is shown on screen):${c.x}\n`);
  for (const key of ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN", "GOOGLE_CALENDAR_ID", "CRON_SECRET"]) {
    console.log(`  grep '^${key}=' .env | cut -d= -f2- | tr -d '\\n' | npx vercel env add ${key} production`);
  }
  console.log(`\n${c.b}Then deploy and verify:${c.x}`);
  console.log(`  npm run deploy`);
  console.log(`  npm run health              ${c.dim}# expect checks.googleCalendar.ok = true${c.x}`);
  console.log(
    `  curl -s -H "x-cron-key: $(grep '^CRON_SECRET=' .env | cut -d= -f2-)" https://www.orasuites.com/api/cron/sync-calendar | head -c 400\n`,
  );
  console.log(`${c.dim}Finally: open Google Calendar as admin@orasuites.com — "${CALENDAR_NAME}" is there.`);
  console.log(`Share it read-only with your own Google account to see it on your phone.${c.x}\n`);

  // readline is imported only so a stray open handle can't keep the process alive
  readline.createInterface({ input: process.stdin }).close();
  process.exit(0);
}

main().catch((err) => die(err?.stack || String(err)));
