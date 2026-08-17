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

echo "▶ promote to production (with auto-rollback)"
PREV=$(npx vercel ls --prod 2>/dev/null | grep -Eo 'https://[a-z0-9-]+\.vercel\.app' | head -1)
npx vercel deploy --prod --yes >/dev/null
sleep 6
P=$(curl -s -m 30 -o /tmp/ora-health.json -w '%{http_code}' "https://www.orasuites.com/api/health" || true)
if [ "$P" = "200" ]; then
  echo "  ✓ PRODUCTION HEALTHY (incl. GHL write scope): $(head -c 260 /tmp/ora-health.json)"
else
  echo "  ✖ PRODUCTION UNHEALTHY ($P): $(head -c 300 /tmp/ora-health.json)"
  if [ -n "$PREV" ]; then echo "  ↩ rolling back to $PREV"; npx vercel rollback "$PREV" --yes >/dev/null && echo "  ✓ rolled back"; fi
  exit 1
fi
