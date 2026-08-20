#!/usr/bin/env python3
"""
Backfill: every historical GHL appointment → an opportunity in "Online Bookings".
The website's booking path now does this automatically; this catches the ones
made before that existed (and any made inside GHL by phone/walk-in).

  python3 script/backfill-opportunities.py            # dry-run
  python3 script/backfill-opportunities.py --apply
"""
import json, os, sys, urllib.request, datetime as dt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = dict(l.strip().split("=", 1) for l in open(os.path.join(ROOT, ".env")) if "=" in l and not l.startswith("#"))
KEY, LOC = ENV["GHL_API_KEY"], ENV["GHL_LOCATION_ID"]
BASE = "https://services.leadconnectorhq.com"
APPLY = "--apply" in sys.argv
PIPELINE = "6NsVFiUCxgAelJszMS1z"
STAGE_BOOKED = "ff701f68-6c63-4838-b4ff-ed37614df9f5"
STAGE_COMPLETED = "47a4a563-6f49-4873-ac31-89542257dff1"

def api(method, path, body=None, version="2021-04-15"):
    req = urllib.request.Request(BASE + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {KEY}", "Version": version, "Content-Type": "application/json",
                 "Accept": "application/json", "User-Agent": "Mozilla/5.0 ora-backfill/1.0"})
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read().decode(); return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        return {"__err": e.code, "__msg": e.read().decode()[:300]}

catalogue = json.load(open(os.path.join(ROOT, "shared", "catalogue.json")))
team = {m["ghlUserId"]: m["name"] for m in catalogue["_meta"]["team"].values()}
svc_by_cal, price_by_cal = {}, {}
for cat in catalogue["categories"]:
    for g in cat.get("groups", []):
        for s in g.get("services", []):
            if s.get("ghlCalendarId"):
                svc_by_cal[s["ghlCalendarId"]] = s["name"]; price_by_cal[s["ghlCalendarId"]] = s["price"]
cals = {c["id"]: c["name"] for c in api("GET", f"/calendars/?locationId={LOC}").get("calendars", [])}

# existing opportunities so we never duplicate
existing = set()
for o in api("GET", f"/opportunities/search?location_id={LOC}&pipeline_id={PIPELINE}&limit=100", version="2021-07-28").get("opportunities", []):
    existing.add((o.get("contactId") or (o.get("contact") or {}).get("id"), (o.get("name") or "").strip()))

start = int(dt.datetime(2026, 6, 1).timestamp() * 1000)
end = int((dt.datetime.now() + dt.timedelta(days=120)).timestamp() * 1000)
appts = {}
for uid in team:
    for ev in api("GET", f"/calendars/events?locationId={LOC}&userId={uid}&startTime={start}&endTime={end}").get("events", []):
        if not ev.get("deleted"):
            appts[ev["id"]] = ev

now = dt.datetime.now(dt.timezone.utc)
created = skipped = 0
for ev in sorted(appts.values(), key=lambda e: e["startTime"]):
    cal = ev.get("calendarId")
    service = svc_by_cal.get(cal) or cals.get(cal, "Appointment")
    contact = api("GET", f"/contacts/{ev['contactId']}", version="2021-07-28").get("contact", {})
    client = (contact.get("contactName") or f"{contact.get('firstName','')} {contact.get('lastName','')}").strip() or "Client"
    name = f"{service} — {client}"
    if (ev["contactId"], name) in existing:
        skipped += 1; continue
    past = dt.datetime.fromisoformat(ev["startTime"]) < now
    stage = STAGE_COMPLETED if past else STAGE_BOOKED
    print(f"  {'+' if APPLY else '·'} {ev['startTime'][:16]} | {name[:46]:46s} | {'Completed' if past else 'Booked'} | {contact.get('email','')}")
    if APPLY:
        r = api("POST", "/opportunities/", {
            "locationId": LOC, "pipelineId": PIPELINE, "pipelineStageId": stage,
            "contactId": ev["contactId"], "name": name, "status": "open",
            **({"monetaryValue": price_by_cal[cal]} if price_by_cal.get(cal) else {}),
        }, version="2021-07-28")
        if "__err" in r: print("     !!", r.get("__msg", "")[:150])
        else: created += 1
print(f"\n{'APPLIED' if APPLY else 'DRY RUN'}: {created} created, {skipped} already present, {len(appts)} appointments seen")
