#!/usr/bin/env bash
# ORÁ Suites — one-shot Stripe env setup.
#   bash script/stripe-setup.sh
#
# Prompts for the three Stripe values, generates the two internal secrets,
# and pushes all of them to Vercel production. Nothing is echoed to the screen,
# nothing is written to disk, nothing is committed.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "ORÁ · Stripe setup"
echo "──────────────────"
echo "Values are hidden as you paste them. Nothing is saved locally."
echo

put () { # put NAME VALUE
  local name="$1" value="$2"
  [ -n "$value" ] || { echo "  ⤬ $name skipped (empty)"; return; }
  npx vercel env rm "$name" production --yes >/dev/null 2>&1 || true
  printf '%s' "$value" | npx vercel env add "$name" production >/dev/null 2>&1
  echo "  ✓ $name set"
}

read -r -s -p "1/3  Stripe SECRET key (sk_live_…): " SK; echo
read -r -s -p "2/3  Stripe PUBLISHABLE key (pk_live_…): " PK; echo
echo
echo "     Now create the webhook in Stripe → Developers → Webhooks → Add endpoint"
echo "       URL:    https://www.orasuites.com/api/webhooks/stripe"
echo "       Events: charge.refunded, payment_intent.payment_failed"
read -r -s -p "3/3  Webhook signing secret (whsec_…): " WH; echo
echo

echo "Setting environment variables…"
put STRIPE_SECRET_KEY "$SK"
put VITE_STRIPE_PUBLISHABLE_KEY "$PK"
put STRIPE_PUBLISHABLE_KEY "$PK"
put STRIPE_WEBHOOK_SECRET "$WH"
put BOOKING_CANCEL_SECRET "$(openssl rand -hex 32)"
put ADMIN_CANCEL_SECRET "$(openssl rand -hex 32)"
unset SK PK WH

echo
echo "Done. Now run:  npm run deploy"
echo "Then tell Claude — it will test the full payment + refund flow end to end."
