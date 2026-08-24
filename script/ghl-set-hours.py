#!/usr/bin/env python3
"""
Push the catalogue's truth onto every GHL calendar: opening hours AND slot length.

The clinic opens 10:00-17:00, seven days a week, and treatments must FINISH by
17:00. GHL does that arithmetic itself -- it only offers a slot if
start + slotDuration falls inside the open window -- but ONLY if slotDuration is
the real treatment length. Every service calendar was sitting at GHL's default
30 minutes (audited 24 Aug 2026), which offered a 90-minute nail set at 16:30,
finishing at 18:00. So we push BOTH values, from shared/catalogue.json, together.

Calendars with no catalogue entry (personal calendars, the master booking
calendar) get the hours only -- their slot length is not ours to define.

Usage:  python3 script/ghl-set-hours.py [--dry-run]
"""
import json, sys, urllib.request, urllib.error, time

OPEN_H, OPEN_M, CLOSE_H, CLOSE_M = 10, 0, 17, 0
DAYS = [0, 1, 2, 3, 4, 5, 6]          # GHL: 0 = Sunday .. 6 = Saturday
DRY = "--dry-run" in sys.argv

env = {}
for line in open(".env"):
    line = line.strip()
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1)
        env[k] = v.strip().strip('"')
KEY, LOC = env["GHL_API_KEY"], env["GHL_LOCATION_ID"]

def call(path, method="GET", payload=None, ver="2021-04-15"):
    req = urllib.request.Request(
        "https://services.leadconnectorhq.com" + path, method=method,
        data=json.dumps(payload).encode() if payload else None,
        headers={"Authorization": "Bearer " + KEY, "Version": ver,
                 "Accept": "application/json", "Content-Type": "application/json",
                 "User-Agent": "Mozilla/5.0 ora-suites/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return {"__err": e.code, "__body": e.read().decode()[:300]}

OPEN_HOURS = [{"daysOfTheWeek": [d],
               "hours": [{"openHour": OPEN_H, "openMinute": OPEN_M,
                          "closeHour": CLOSE_H, "closeMinute": CLOSE_M}]}
              for d in DAYS]

# calendarId -> real treatment length, straight from the catalogue
CAT = json.load(open("shared/catalogue.json", encoding="utf-8"))
DURATION = {sv["ghlCalendarId"]: int(sv["duration"])
            for c in CAT["categories"] for g in c["groups"] for sv in g["services"]
            if sv.get("ghlCalendarId") and sv.get("duration")}

cals = call(f"/calendars/?locationId={LOC}").get("calendars", [])
print(f"{len(cals)} calendars  ->  {OPEN_H:02d}:{OPEN_M:02d}-{CLOSE_H:02d}:{CLOSE_M:02d}, all 7 days"
      + ("   [DRY RUN]" if DRY else ""))

changed = skipped = failed = 0
for c in cals:
    full = call(f"/calendars/{c['id']}").get("calendar", {})
    name, active = full.get("name", "?"), full.get("isActive")
    if not active:                       # leave disabled calendars alone
        skipped += 1
        continue
    want = {"openHours": OPEN_HOURS}
    real = DURATION.get(c["id"])
    if real and full.get("slotDuration") != real:
        want["slotDuration"] = real
        want["slotDurationUnit"] = "mins"
    if full.get("openHours") == OPEN_HOURS and "slotDuration" not in want:
        skipped += 1
        continue
    note = f"  (slot {full.get('slotDuration')} -> {real} min)" if "slotDuration" in want else ""
    if DRY:
        print(f"  would update  {name}{note}")
        changed += 1
        continue
    res = call(f"/calendars/{c['id']}", "PUT", want)
    if res.get("__err"):
        print(f"  FAILED  {name}: {res['__err']} {res['__body'][:120]}")
        failed += 1
    else:
        print(f"  updated  {name}{note}")
        changed += 1
    time.sleep(0.12)                     # stay under the rate limit

print(f"\nchanged {changed} | unchanged/disabled {skipped} | failed {failed}")
sys.exit(1 if failed else 0)
