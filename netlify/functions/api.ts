import { handlePokerApi } from '../../platform/server/fetchApi'
import { resetSupabaseClient } from '../../platform/server/supabase'

type NetlifyEnv = { env?: { get: (key: string) => string | undefined } }

function readNetlifyEnv(key: string): string | undefined {
  const netlify = (globalThis as { Netlify?: NetlifyEnv }).Netlify
  return netlify?.env?.get(key) ?? process.env[key]
}

function applyFunctionEnv(): void {
  const keys = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'JWT_SECRET',
    'PUBLIC_URL',
  ] as const
  for (const key of keys) {
    const value = readNetlifyEnv(key)
    if (value) process.env[key] = value
  }
  process.env.BASE_PATH = ''
  process.env.PUBLIC_URL = process.env.PUBLIC_URL || 'https://miz.gg'
  process.env.CLOUDFLARE_WORKER = '1'
  process.env.NETLIFY = process.env.NETLIFY || '1'
  // Publishable playground anon key (same values as netlify.toml). Netlify
  // Functions v2 often omit [build.environment] from the isolate process.env.
  process.env.SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://kiztaihzanqnrcrqaxsv.supabase.co'
  process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  process.env.SUPABASE_ANON_KEY =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8'
  process.env.VITE_SUPABASE_ANON_KEY =
    process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  resetSupabaseClient()
}

export default async (request: Request) => {
  applyFunctionEnv()
  return handlePokerApi(request)
}

export const config = {
  path: ['/api/*', '/poker/api/*'],
}
