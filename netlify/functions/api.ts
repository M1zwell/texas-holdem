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
  if (
    process.env.SUPABASE_URL &&
    !process.env.SUPABASE_ANON_KEY &&
    process.env.VITE_SUPABASE_ANON_KEY
  ) {
    process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
  }
  if (!process.env.SUPABASE_URL && process.env.VITE_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.VITE_SUPABASE_URL
  }
  resetSupabaseClient()
}

export default async (request: Request) => {
  applyFunctionEnv()
  return handlePokerApi(request)
}

export const config = {
  path: ['/api/*', '/poker/api/*'],
}
