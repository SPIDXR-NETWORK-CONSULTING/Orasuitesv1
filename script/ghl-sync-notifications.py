#!/usr/bin/env python3
"""
Ensure every ORÁ booking calendar has contact-facing notifications:
  confirmation  → contact: email + SMS (immediately on booking)
  reminder      → contact: SMS + email, 1 hour before start
  booked        → assigned practitioner: in-app + email
Idempotent by (channel, notificationType, receiverType). Updates timing/copy if present.

  python3 script/ghl-sync-notifications.py             # dry-run
  python3 script/ghl-sync-notifications.py --apply
  python3 script/ghl-sync-notifications.py --apply --only <calendarId>
"""
import json, os, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = dict(l.strip().split("=", 1) for l in open(os.path.join(ROOT, ".env")) if "=" in l and not l.startswith("#"))
KEY, LOC = ENV["GHL_API_KEY"], ENV["GHL_LOCATION_ID"]
BASE = "https://services.leadconnectorhq.com"
APPLY = "--apply" in sys.argv
ONLY = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
H = {"Authorization": f"Bearer {KEY}", "Version": "2021-04-15", "Content-Type": "application/json",
     "Accept": "application/json", "User-Agent": "Mozilla/5.0 ora-suites-sync/1.0"}

def api(method, path, body=None):
    req = urllib.request.Request(BASE + path, method=method, headers=H,
                                 data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read().decode(); return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        return {"error": e.code, "message": e.read().decode()[:500]}

ADDRESS = "ORÁ Suites, 49 Deansgate, Manchester M3 2AY"
SIGN = "<br><br>With love,<br>The ORÁ Suites team<br>admin@orasuites.com"

CONFIRM_EMAIL = {
    "subject": "You're booked ✨ {{appointment.title}} — {{appointment.start_time}}",
    "body": ("Hi {{contact.first_name}},<br><br>Your appointment at ORÁ Suites is confirmed. Here are the details:<br><br>"
             "<b>Treatment:</b> {{appointment.title}}<br>"
             "<b>Date &amp; time:</b> {{appointment.start_time}} ({{appointment.timezone}})<br>"
             "<b>With:</b> {{appointment.user.name}}<br>"
             f"<b>Where:</b> {ADDRESS}<br><br>"
             "Need to change your time? Reply to this email or use the link in your booking to reschedule or cancel."
             + SIGN),
}
CONFIRM_SMS = {
    "body": ("ORÁ Suites: you're booked ✨ {{appointment.title}} on {{appointment.start_time}} with {{appointment.user.name}}. "
             f"{ADDRESS}. Reply to this message if you need to change your time."),
}
REMIND_SMS = {
    "body": (f"Reminder from ORÁ Suites: your {{{{appointment.title}}}} appointment is in 1 hour at {{{{appointment.start_time}}}}. "
             f"{ADDRESS}. See you soon!"),
}
REMIND_EMAIL = {
    "subject": "See you in 1 hour — {{appointment.title}} at ORÁ Suites",
    "body": ("Hi {{contact.first_name}},<br><br>Just a gentle reminder that your appointment is in <b>1 hour</b>.<br><br>"
             "<b>Treatment:</b> {{appointment.title}}<br>"
             "<b>Time:</b> {{appointment.start_time}} ({{appointment.timezone}})<br>"
             "<b>With:</b> {{appointment.user.name}}<br>"
             f"<b>Where:</b> {ADDRESS}" + SIGN),
}
STAFF_EMAIL = {
    "subject": "New booking: {{contact.name}} — {{appointment.title}} at {{appointment.start_time}}",
    "body": ("New appointment booked.<br><br><b>Client:</b> {{contact.name}} ({{contact.phone}}, {{contact.email}})<br>"
             "<b>Treatment:</b> {{appointment.title}}<br><b>When:</b> {{appointment.start_time}} ({{appointment.timezone}})<br>"
             "<b>Notes:</b> {{appointment.notes}}"),
}

def desired():
    # OWNERSHIP MODEL (17 Aug 2026):
    #   • Booking confirmation (client) and the practitioner alert are sent by OUR
    #     code (api/_lib/booking-notify.ts) — deterministic and verifiable. GHL's
    #     native confirmation is therefore DISABLED to avoid duplicate emails.
    #   • The 1-hour reminder stays with GHL: it fires reliably and we would
    #     otherwise have to build a scheduler.
    #   • ALL SMS is disabled until a phone number is provisioned — without one
    #     every SMS records as "failed" and clutters the client's timeline.
    return [
        {"receiverType": "contact", "channel": "email", "notificationType": "confirmation", "isActive": False, **CONFIRM_EMAIL},
        {"receiverType": "contact", "channel": "sms",   "notificationType": "confirmation", "isActive": False, **CONFIRM_SMS},
        {"receiverType": "contact", "channel": "sms",   "notificationType": "reminder", "isActive": False,
         "beforeTime": [{"timeOffset": 1, "unit": "hours"}], **REMIND_SMS},
        {"receiverType": "contact", "channel": "email", "notificationType": "reminder", "isActive": True,
         "beforeTime": [{"timeOffset": 1, "unit": "hours"}], **REMIND_EMAIL},
        {"receiverType": "assignedUser", "channel": "email", "notificationType": "booked", "isActive": True,
         "selectedUsers": ["assigned_user"], **STAFF_EMAIL},
        {"receiverType": "assignedUser", "channel": "inApp", "notificationType": "booked", "isActive": True,
         "selectedUsers": ["assigned_user"]},
        {"receiverType": "assignedUser", "channel": "inApp", "notificationType": "reminder", "isActive": True,
         "selectedUsers": ["assigned_user"], "beforeTime": [{"timeOffset": 1, "unit": "hours"}]},
    ]

cals = api("GET", f"/calendars/?locationId={LOC}").get("calendars", [])
cals = [c for c in cals if (ONLY and c["id"] == ONLY) or (not ONLY and c.get("calendarType") == "service_booking")]
print(f"{len(cals)} service calendars")
created = updated = 0
for c in cals:
    existing = api("GET", f"/calendars/{c['id']}/notifications")
    if isinstance(existing, dict): print("  !! list failed", c["name"], existing); continue
    idx = {(n["channel"], n["notificationType"], n["receiverType"]): n for n in existing if not n.get("deleted")}
    for want in desired():
        k = (want["channel"], want["notificationType"], want["receiverType"])
        if k in idx:
            ex = idx[k]
            body = {kk: vv for kk, vv in want.items()}
            print(f"  ~ {c['name'][:45]:45s} update {k}")
            if APPLY:
                r = api("PUT", f"/calendars/{c['id']}/notifications/{ex['_id']}", body)
                if "error" in r: print("     !!", r)
                else: updated += 1
            else: updated += 1
        else:
            print(f"  + {c['name'][:45]:45s} create {k}")
            if APPLY:
                r = api("POST", f"/calendars/{c['id']}/notifications", [ {"altType": "calendar", "altId": c["id"], **want} ])
                if "error" in r:
                    r = api("POST", f"/calendars/{c['id']}/notifications", {"altType": "calendar", "altId": c["id"], **want})
                if "error" in r: print("     !!", r)
                else: created += 1
            else: created += 1
        if APPLY: time.sleep(0.15)
print(f"\n{'APPLIED' if APPLY else 'DRY RUN'}: created={created} updated={updated}")
