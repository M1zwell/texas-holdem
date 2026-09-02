#!/usr/bin/env bash
# Create (or reuse) the Fly app and deploy Jub Poker at /poker.
# Requires: flyctl auth, and a Fly org that can create apps (no overdue invoices).
set -euo pipefail
export PATH="${FLYCTL_INSTALL:-$HOME/.fly}/bin:$PATH"
APP="${1:-jub-poker}"
ORG="${FLY_ORG:-personal}"

if ! fly auth whoami >/dev/null 2>&1; then
  echo "flyctl is not authenticated. Run: fly auth login" >&2
  exit 1
fi

if ! fly status -a "$APP" >/dev/null 2>&1; then
  fly apps create "$APP" --org "$ORG"
fi

JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
fly secrets set --app "$APP" \
  JWT_SECRET="$JWT_SECRET" \
  SUPABASE_URL="${SUPABASE_URL:-https://kiztaihzanqnrcrqaxsv.supabase.co}" \
  SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8}"

fly deploy --app "$APP" --ha=false
echo "Health: https://${APP}.fly.dev/api/health"
echo "App:    https://${APP}.fly.dev/poker/"
echo "Point Cloudflare Worker POKER_ORIGIN at ${APP}.fly.dev (keep /poker prefix)."
