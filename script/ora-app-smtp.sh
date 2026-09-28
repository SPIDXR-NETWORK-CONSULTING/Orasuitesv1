#!/usr/bin/env bash
# ORÁ app — send account emails (confirm / reset password) from hello@orasuites.com
# instead of Supabase, through ORÁ's Google Workspace.
#
# Before running (Google, once):
#   1. Google Admin → Users → admin@orasuites.com → add alias  hello@orasuites.com
#   2. myaccount.google.com/apppasswords (signed in as admin@orasuites.com) → create
#      an App Password called "ORÁ app". It needs 2-Step Verification on.
# Then: bash script/ora-app-smtp.sh   — it asks for that App Password (hidden) and
# saves it straight into Supabase. The password is never printed or stored here.
set -euo pipefail
REF=mpfhtuygmqkugiuaxcng
read -r -p "Google login that sends the mail [admin@orasuites.com]: " SMTP_USER
export SMTP_USER=${SMTP_USER:-admin@orasuites.com}
read -r -s -p "App Password for $SMTP_USER (16 letters, spaces OK): " SMTP_PASS; echo
export SMTP_PASS=${SMTP_PASS// /}
[ ${#SMTP_PASS} -eq 16 ] || { echo "✖ That isn't 16 letters. Nothing was changed."; exit 1; }
TOKEN=$(security find-generic-password -s "Supabase CLI" -a supabase -w)
python3 -c 'import json,os; print(json.dumps({
  "smtp_host": "smtp.gmail.com", "smtp_port": "465",
  "smtp_user": os.environ["SMTP_USER"], "smtp_pass": os.environ["SMTP_PASS"],
  "smtp_admin_email": "hello@orasuites.com", "smtp_sender_name": "ORÁ Suites",
  "rate_limit_email_sent": 100}))' |
  curl -s -o /dev/null -w "%{http_code}" -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    --data @- "https://api.supabase.com/v1/projects/$REF/config/auth" > /tmp/ora-smtp.code
unset SMTP_PASS
if [ "$(cat /tmp/ora-smtp.code)" = "200" ]; then
  echo "✓ Done. ORÁ app emails now come from ORÁ Suites <hello@orasuites.com>."
else
  echo "✖ Supabase said $(cat /tmp/ora-smtp.code). Nothing else was changed."
fi
rm -f /tmp/ora-smtp.code
