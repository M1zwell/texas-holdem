import { handlePokerApi } from '../../platform/server/fetchApi'

export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  JWT_SECRET?: string
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  BASE_PATH?: string
  PUBLIC_URL?: string
  /** Fly.io origin for long-lived Socket.IO, e.g. https://jub-poker.fly.dev */
  FLY_SOCKET_ORIGIN?: string
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

function isSocketPath(pathname: string): boolean {
  return pathname.includes('/socket.io')
}

export async function proxySocketToFly(request: Request, origin: string): Promise<Response> {
  const incoming = new URL(request.url)
  const dest = new URL(incoming.pathname + incoming.search, origin)
  const headers = new Headers(request.headers)
  headers.set('host', dest.host)
  return fetch(
    new Request(dest.toString(), {
      method: request.method,
      headers,
      body: request.body,
      redirect: 'manual',
    }),
  )
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    applyEnv(env)
    const url = new URL(request.url)
    if (isSocketPath(url.pathname)) {
      const origin = env.FLY_SOCKET_ORIGIN
      if (!origin) {
        return new Response(JSON.stringify({ error: 'Socket backend not configured' }), {
          status: 503,
          headers: { 'content-type': 'application/json' },
        })
      }
      return proxySocketToFly(request, origin)
    }
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
