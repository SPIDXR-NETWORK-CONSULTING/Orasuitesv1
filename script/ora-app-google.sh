#!/usr/bin/env bash
# ORÁ app — switch on "Continue with Google" in Supabase (project ora-app).
# Needs the Web OAuth client from Google Cloud project "ORA Suites Sign-in"
# (Clients → "ORA app via Supabase"). The secret is typed hidden and sent straight to
# Supabase; it is never printed or stored here.
set -euo pipefail
REF=mpfhtuygmqkugiuaxcng
read -r -p "Google Client ID (ends in .apps.googleusercontent.com): " GID
export GID=$(printf %s "$GID" | tr -d '[:space:]')
case "$GID" in *.apps.googleusercontent.com) ;; *) echo "✖ That doesn't look like a Client ID. Nothing was changed."; exit 1;; esac
read -r -s -p "Google Client secret (hidden): " GSECRET; echo
export GSECRET=$(printf %s "$GSECRET" | tr -d '[:space:]')
[ ${#GSECRET} -ge 20 ] || { echo "✖ That secret looks too short. Nothing was changed."; exit 1; }
TOKEN=$(security find-generic-password -s "Supabase CLI" -a supabase -w)
python3 -c 'import json,os; print(json.dumps({"external_google_enabled": True, "external_google_client_id": os.environ["GID"], "external_google_secret": os.environ["GSECRET"]}))' |
  curl -s -o /dev/null -w "%{http_code}" -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    --data @- "https://api.supabase.com/v1/projects/$REF/config/auth" > /tmp/ora-google.code
unset GSECRET
if [ "$(cat /tmp/ora-google.code)" = "200" ]; then echo "✓ Done. Google sign-in is switched on in Supabase."; else echo "✖ Supabase said $(cat /tmp/ora-google.code). Nothing else was changed."; fi
rm -f /tmp/ora-google.code
