#!/usr/bin/env bash
# Build the /poker SPA and deploy the Cloudflare Worker (replaces Fly for jubuddy.com/poker).
set -euo pipefail
cd "$(dirname "$0")/.."
VITE_BASE_PATH=/poker/ \
  VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-https://kiztaihzanqnrcrqaxsv.supabase.co}" \
  VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8}" \
  npm run build
npx wrangler deploy --config cloudflare/wrangler.jsonc "$@"
