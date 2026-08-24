#!/usr/bin/env python3
"""
Sync shared/catalogue.json → GoHighLevel service calendars.
One service_booking calendar per service, grouped by category, round-robin
(equal distribution) across the category team. Idempotent: matches by name.

Usage:
  python3 script/ghl-sync-services.py            # dry-run (prints plan)
  python3 script/ghl-sync-services.py --apply    # create/update
  python3 script/ghl-sync-services.py --apply --only nails
"""
import json, os, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = {}
for line in open(os.path.join(ROOT, ".env")):
    line = line.strip()
    if "=" in line and not line.startswith("#"):
        k, v = line.split("=", 1); ENV[k] = v
KEY, LOC = ENV["GHL_API_KEY"], ENV["GHL_LOCATION_ID"]
BASE = "https://services.leadconnectorhq.com"
APPLY = "--apply" in sys.argv
ONLY = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None

def api(method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {KEY}", "Version": "2021-04-15",
                 "Content-Type": "application/json", "Accept": "application/json",
                 "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36 ora-suites-sync/1.0"})
    try:
        with urllib.request.urlopen(req) as r: return json.load(r)
    except urllib.error.HTTPError as e:
        return {"error": e.code, "message": e.read().decode()[:400]}

cat = json.load(open(os.path.join(ROOT, "shared", "catalogue.json")))
team = cat["_meta"]["team"]

# Clinic hours: Mon–Sat 10:00–19:30, Sun 10:00–17:00. Day 0 = Sunday (GHL convention).
OPEN_HOURS = [{"daysOfTheWeek": [d], "hours": [{"openHour": 10, "openMinute": 0, "closeHour": 19, "closeMinute": 30}]} for d in range(1, 7)]
OPEN_HOURS += [{"daysOfTheWeek": [0], "hours": [{"openHour": 10, "openMinute": 0, "closeHour": 17, "closeMinute": 0}]}]

existing = {c["name"]: c for c in api("GET", f"/calendars/?locationId={LOC}").get("calendars", [])}
groups = {g["name"]: g for g in api("GET", f"/calendars/groups?locationId={LOC}").get("groups", [])}

def ensure_group(name, slug):
    if name in groups: return groups[name]["id"]
    print(f"  + group {name}")
    if not APPLY: return "DRY"
    r = api("POST", "/calendars/groups", {"locationId": LOC, "name": name, "description": f"ORÁ Suites — {name}", "slug": slug, "isActive": True})
    gid = (r.get("group") or r).get("id")
    if not gid: print("    !! group create failed", r); sys.exit(1)
    groups[name] = {"id": gid}; return gid

created = updated = skipped = 0
for c in cat["categories"]:
    if not c.get("live") or (ONLY and c["id"] != ONLY): continue
    members = [{"userId": team[m]["ghlUserId"], "priority": 0.5} for m in c["team"]]
    gid = c.get("ghlGroupId") or ensure_group(f"ORÁ {c['title']}", f"ora-{c['id']}")
    print(f"\n== {c['title']} (group {gid}) team={c['team']}")
    for grp in c["groups"]:
        for s in grp["services"]:
            name = f"{s['name']}"
            desc = f"{grp['name']} · {'Free' if s['price']==0 else '£'+str(s['price'])} · {s['duration']} min"
            payload = {
                "locationId": LOC, "name": name, "description": desc,
                "calendarType": "service_booking",
                "eventType": "RoundRobin_OptimizeForEqualDistribution",
                "groupId": gid, "teamMembers": members,
                "slotDuration": s["duration"], "slotDurationUnit": "mins",
                "slotInterval": 15, "slotIntervalUnit": "mins",
                "slotBuffer": 15, "slotBufferUnit": "mins",
                "appoinmentPerSlot": 1, "autoConfirm": True,
                "allowReschedule": True, "allowCancellation": True,
                "eventTitle": "{{contact.name}} — " + name, "eventColor": "#b98867",
                "openHours": OPEN_HOURS, "isActive": True,
                "notes": json.dumps({"price": s["price"], "category": c["id"], "group": grp["name"], "depositPercent": cat["_meta"]["depositPercent"]}),
            }
            if name in existing:
                ex = existing[name]
                print(f"  ~ update  {name:70s} {desc}")
                if APPLY:
                    r = api("PUT", f"/calendars/{ex['id']}", {k: v for k, v in payload.items() if k != "locationId"})
                    if "error" in r: print("    !!", r)
                    else: updated += 1
                else: updated += 1
            else:
                print(f"  + create  {name:70s} {desc}")
                if APPLY:
                    r = api("POST", "/calendars/", payload)
                    cid = (r.get("calendar") or {}).get("id")
                    if not cid: print("    !!", r)
                    else: created += 1; existing[name] = r["calendar"]
                    time.sleep(0.25)
                else: created += 1
print(f"\n{'APPLIED' if APPLY else 'DRY RUN'}: create={created} update={updated}")
