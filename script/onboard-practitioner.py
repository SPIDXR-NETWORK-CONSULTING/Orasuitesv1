#!/usr/bin/env python3
"""
Onboard a practitioner in one command.

  python3 script/onboard-practitioner.py --name "Jane Doe" --email jane@orasuites.com --category nails
  python3 script/onboard-practitioner.py --name "Jane Doe" --email jane@orasuites.com --category nails --apply

What it does (idempotent):
  1. verifies the person exists as a GHL user (they must be invited in GHL first —
     GHL has no API to create users, and they need a login anyway)
  2. adds them to shared/catalogue.json (team + the category's team list)
  3. adds them to EVERY service calendar in that category, round-robin
  4. prints the remaining human steps

Removing someone: --remove --email jane@orasuites.com  (drops them from every
calendar and the catalogue; their past appointments are untouched.)
"""
import json, os, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = dict(l.strip().split("=", 1) for l in open(os.path.join(ROOT, ".env")) if "=" in l and not l.startswith("#"))
KEY, LOC = ENV["GHL_API_KEY"], ENV["GHL_LOCATION_ID"]
BASE = "https://services.leadconnectorhq.com"
CAT_PATH = os.path.join(ROOT, "shared", "catalogue.json")

def arg(flag, default=None):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else default
APPLY = "--apply" in sys.argv
REMOVE = "--remove" in sys.argv
NAME, EMAIL, CATEGORY = arg("--name"), arg("--email"), arg("--category")
if not EMAIL or (not REMOVE and (not NAME or not CATEGORY)):
    print(__doc__); sys.exit(1)

def api(method, path, body=None, version="2021-04-15"):
    req = urllib.request.Request(BASE + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": f"Bearer {KEY}", "Version": version, "Content-Type": "application/json",
                 "Accept": "application/json", "User-Agent": "Mozilla/5.0 ora-onboard/1.0"})
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read().decode(); return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        return {"__err": e.code, "__msg": e.read().decode()[:300]}

users = {u["email"].lower(): u for u in api("GET", f"/users/?locationId={LOC}", version="2021-07-28").get("users", [])}
user = users.get(EMAIL.lower())
if not user and not REMOVE:
    print(f"✖ {EMAIL} is not a GHL user yet.\n"
          f"  First: GHL → Settings → My Staff → Add Employee (email must be EXACTLY their\n"
          f"  Google Workspace address). Then re-run this script.")
    sys.exit(1)
uid = user["id"] if user else None

cat = json.load(open(CAT_PATH))
key = (NAME or EMAIL).split()[0].lower() if not REMOVE else next(
    (k for k, v in cat["_meta"]["team"].items() if v.get("email", "").lower() == EMAIL.lower()), None)
if REMOVE and not key:
    print(f"✖ {EMAIL} is not in the catalogue."); sys.exit(1)
if REMOVE:
    uid = cat["_meta"]["team"][key]["ghlUserId"]

targets = []
for c in cat["categories"]:
    if not c.get("live"):
        continue
    in_cat = key in c.get("team", [])
    if (not REMOVE and c["id"] == CATEGORY) or (REMOVE and in_cat):
        for g in c.get("groups", []):
            for s in g.get("services", []):
                if s.get("ghlCalendarId"):
                    targets.append((s["name"], s["ghlCalendarId"]))

verb = "REMOVE from" if REMOVE else "ADD to"
print(f"{verb} {len(targets)} service calendars — {NAME or key} <{EMAIL}> (GHL user {uid})\n")
changed = 0
for sname, calid in targets:
    c = api("GET", f"/calendars/{calid}").get("calendar", {})
    members = c.get("teamMembers", []) or []
    ids = [m.get("userId") for m in members]
    if REMOVE:
        if uid not in ids: continue
        members = [m for m in members if m.get("userId") != uid]
    else:
        if uid in ids: continue
        members = members + [{"userId": uid, "priority": 0.5, "selected": True,
                              "locationConfigurations": [{"kind": "custom", "location": "", "position": len(members), "meetingId": "custom_0"}]}]
    print(f"  {'-' if REMOVE else '+'} {sname[:52]}")
    if APPLY:
        r = api("PUT", f"/calendars/{calid}", {"teamMembers": members,
                                               "eventType": "RoundRobin_OptimizeForEqualDistribution"})
        if "__err" in r: print("     !!", r.get("__msg", "")[:140])
        else: changed += 1
    else:
        changed += 1

if APPLY:
    if REMOVE:
        cat["_meta"]["team"].pop(key, None)
        for c in cat["categories"]:
            if key in c.get("team", []): c["team"].remove(key)
    else:
        cat["_meta"]["team"][key] = {"ghlUserId": uid, "name": NAME, "email": EMAIL}
        for c in cat["categories"]:
            if c["id"] == CATEGORY and key not in c.setdefault("team", []):
                c["team"].append(key)
    json.dump(cat, open(CAT_PATH, "w"), indent=2, ensure_ascii=False)
    print("\n✓ catalogue.json updated")

print(f"\n{'APPLIED' if APPLY else 'DRY RUN'}: {changed} calendars {'updated' if APPLY else 'would change'}")
if APPLY and not REMOVE:
    print(f"""
REMAINING HUMAN STEPS for {NAME}:
  1. They accept the GHL invite and set a password.
  2. They connect Google Calendar in GHL (My Profile → Calendar Settings) — optional,
     because they also get a Google Calendar invite to every booking automatically.
  3. Set their working hours: GHL → Calendars → each service → Availability,
     or simply have them block personal time in their own Google Calendar.
  4. Deploy so the website knows about them:  npm run deploy
""")
