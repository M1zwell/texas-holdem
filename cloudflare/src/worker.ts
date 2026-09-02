import { handlePokerApi } from '../../platform/server/fetchApi'

export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  JWT_SECRET?: string
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  BASE_PATH?: string
  PUBLIC_URL?: string
}

function applyEnv(env: Env): void {
  if (env.JWT_SECRET) process.env.JWT_SECRET = env.JWT_SECRET
  if (env.SUPABASE_URL) {
    process.env.SUPABASE_URL = env.SUPABASE_URL
    process.env.VITE_SUPABASE_URL = env.SUPABASE_URL
  }
  if (env.SUPABASE_ANON_KEY) {
    process.env.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY
    process.env.VITE_SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY
  }
  process.env.BASE_PATH = env.BASE_PATH || '/poker'
  process.env.PUBLIC_URL = env.PUBLIC_URL || 'https://jubuddy.com'
  process.env.CLOUDFLARE_WORKER = '1'
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    applyEnv(env)
    const url = new URL(request.url)
    if (url.pathname.startsWith('/poker/api') || url.pathname.startsWith('/api')) {
      return handlePokerApi(request)
    }
    if (url.pathname === '/poker' || url.pathname === '/poker/') {
      const index = new URL('/index.html', url.origin)
      return env.ASSETS.fetch(new Request(index, request))
    }
    if (url.pathname.startsWith('/poker/')) {
      const stripped = new URL(url.pathname.slice('/poker'.length) || '/', url.origin)
      stripped.search = url.search
      const asset = await env.ASSETS.fetch(new Request(stripped, request))
      if (asset.status !== 404) return asset
      return env.ASSETS.fetch(new Request(new URL('/index.html', url.origin), request))
    }
    return env.ASSETS.fetch(request)
  },
}
