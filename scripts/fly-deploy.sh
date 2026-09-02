#!/usr/bin/env bash
# Deploy the optional Socket.IO VM on the elliot1985@hotmail.com Fly org.
# Unsets FLY_API_TOKEN so a leftover yying2010 token cannot override CLI login.
set -euo pipefail
cd "$(dirname "$0")/.."
unset FLY_API_TOKEN
export PATH="${HOME}/.fly/bin:${PATH}"

who="$(flyctl auth whoami 2>/dev/null || true)"
if [[ "${who}" != *elliot1985@hotmail.com* ]]; then
  echo "Log in as elliot1985@hotmail.com first:"
  echo "  unset FLY_API_TOKEN && flyctl auth login"
  echo "Current identity: ${who:-none}"
  exit 1
fi

if ! flyctl apps list --json | grep -q '"Name": "jub-poker"'; then
  echo "Creating app jub-poker on org Elliot (personal)…"
  if ! flyctl apps create jub-poker --org personal; then
    echo "Add a payment method, then rerun:"
    echo "  https://fly.io/dashboard/elliot-562/billing"
    exit 1
  fi
fi

JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
flyctl secrets set --app jub-poker \
  "JWT_SECRET=${JWT_SECRET}" \
  "SUPABASE_URL=${SUPABASE_URL:-https://kiztaihzanqnrcrqaxsv.supabase.co}" \
  "SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-${VITE_SUPABASE_ANON_KEY:-}}" \
  "PUBLIC_URL=${PUBLIC_URL:-https://jubuddy.com}" \
  "BASE_PATH=/poker"

flyctl deploy --config fly.toml --app jub-poker --ha=false

echo "Set this on the Cloudflare Worker, then wrangler deploy:"
echo "  FLY_SOCKET_ORIGIN=https://jub-poker.fly.dev"
echo "  npx wrangler secret put FLY_SOCKET_ORIGIN --config cloudflare/wrangler.jsonc"
echo "Scale-to-zero is already in fly.toml (256MB shared-cpu-1x, no volume)."
