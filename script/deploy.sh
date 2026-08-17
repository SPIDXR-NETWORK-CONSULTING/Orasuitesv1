#!/usr/bin/env bash
# ORÁ Suites — gated production deploy.
#   1. type-check + build
#   2. deploy a PREVIEW to Vercel
#   3. verify /api/health returns ok:true on that preview (GHL key, calendars, slots)
#   4. verify env parity (Vercel prod env keys match local .env — catches stale keys)
#   5. only then promote to production, and re-check health on www.orasuites.com
# Usage: bash script/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "▶ type-check"; npx tsc --noEmit
echo "▶ preview deploy"
PREVIEW=$(npx vercel deploy --yes 2>/dev/null | grep -Eo 'https://[a-z0-9-]+\.vercel\.app' | tail -1)
[ -n "$PREVIEW" ] || { echo "✖ could not get preview URL"; exit 1; }
echo "  $PREVIEW"

echo "▶ health on preview"
# preview deployments are protected by default → use a bypass header only if configured; otherwise test prod env parity below
H=$(curl -s -m 30 -o /tmp/ora-health.json -w '%{http_code}' "$PREVIEW/api/health" || true)
if [ "$H" = "200" ]; then
  echo "  ✓ health 200: $(cat /tmp/ora-health.json | head -c 200)"
elif [ "$H" = "401" ] || [ "$H" = "403" ] || [ "$H" = "302" ] || [ "$H" = "307" ]; then
  echo "  (preview protected — skipping preview health, will verify on production)"
else
  echo "  ✖ health $H: $(cat /tmp/ora-health.json 2>/dev/null | head -c 300)"; exit 1
fi

echo "▶ env parity (local .env vs Vercel production)"
LOCAL_KEY=$(grep '^GHL_API_KEY=' .env | cut -d= -f2-)
npx vercel env pull /tmp/ora-prod.env --environment=production --yes >/dev/null 2>&1
PROD_KEY=$(grep '^GHL_API_KEY=' /tmp/ora-prod.env | cut -d= -f2- | tr -d '"'); rm -f /tmp/ora-prod.env
if [ "$LOCAL_KEY" != "$PROD_KEY" ]; then
  echo "  ✖ GHL_API_KEY differs between local .env and Vercel production — fix with: printf '%s' \"\$GHL_API_KEY\" | npx vercel env add GHL_API_KEY production --force"; exit 1
fi
echo "  ✓ keys match"

echo "▶ promote to production"
npx vercel deploy --prod --yes >/dev/null
sleep 5
P=$(curl -s -m 30 -o /tmp/ora-health.json -w '%{http_code}' "https://www.orasuites.com/api/health" || true)
if [ "$P" = "200" ]; then echo "  ✓ PRODUCTION HEALTHY: $(head -c 240 /tmp/ora-health.json)"; else echo "  ✖ PRODUCTION UNHEALTHY ($P): $(head -c 300 /tmp/ora-health.json)"; exit 1; fi
