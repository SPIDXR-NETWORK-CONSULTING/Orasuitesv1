#!/usr/bin/env bash
# ORÁ app — switch on "Continue with Google" in Supabase (project ora-app).
# Needs the Web OAuth client from Google Cloud project "ORA Suites Sign-in"
# (Clients → "ORA app via Supabase"). The secret is typed hidden and sent straight to
# Supabase; it is never printed or stored here.
set -euo pipefail
REF=mpfhtuygmqkugiuaxcng
# The Client ID is public (Google Cloud → Clients → "ORA app via Supabase"), so it's fixed here
# and the tool only asks for the secret.
export GID=595217097652-vqurd43rvei2cmdecujdd7j60g6ed5pu.apps.googleusercontent.com
read -r -s -p "Paste the Google Client SECRET (starts GOCSPX-, stays hidden), then Enter: " GSECRET; echo
export GSECRET=$(printf %s "$GSECRET" | tr -d '[:space:]')
case "$GSECRET" in GOCSPX-*) ;; *) echo "✖ That isn't a Google client secret (they start GOCSPX-). Nothing was changed."; exit 1;; esac
TOKEN=$(security find-generic-password -s "Supabase CLI" -a supabase -w)
python3 -c 'import json,os; print(json.dumps({"external_google_enabled": True, "external_google_client_id": os.environ["GID"], "external_google_secret": os.environ["GSECRET"]}))' |
  curl -s -o /dev/null -w "%{http_code}" -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    --data @- "https://api.supabase.com/v1/projects/$REF/config/auth" > /tmp/ora-google.code
unset GSECRET
if [ "$(cat /tmp/ora-google.code)" = "200" ]; then echo "✓ Done. Google sign-in is switched on in Supabase."; else echo "✖ Supabase said $(cat /tmp/ora-google.code). Nothing else was changed."; fi
rm -f /tmp/ora-google.code
