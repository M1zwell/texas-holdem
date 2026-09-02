import { handlePokerApi } from '../../platform/server/fetchApi'
import { isMizHost } from '../../platform/server/hosts'

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

function applyEnv(env: Env, hostname: string): void {
  if (env.JWT_SECRET) process.env.JWT_SECRET = env.JWT_SECRET
  if (env.SUPABASE_URL) {
    process.env.SUPABASE_URL = env.SUPABASE_URL
    process.env.VITE_SUPABASE_URL = env.SUPABASE_URL
  }
  if (env.SUPABASE_ANON_KEY) {
    process.env.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY
    process.env.VITE_SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY
  }
  process.env.CLOUDFLARE_WORKER = '1'
  if (isMizHost(hostname)) {
    process.env.BASE_PATH = ''
    process.env.PUBLIC_URL = `https://${hostname === 'www.miz.gg' ? 'miz.gg' : hostname}`
    return
  }
  process.env.BASE_PATH = env.BASE_PATH || '/poker'
  process.env.PUBLIC_URL = env.PUBLIC_URL || 'https://jubuddy.com'
}

function isSocketPath(pathname: string): boolean {
  return pathname.includes('/socket.io')
}

const assetOrigin = 'https://assets.local'

/** Fetch Worker assets without leaking /index.html → / redirects onto jubuddy.com. */
export async function serveAsset(env: Env, pathname: string): Promise<Response> {
  const first = await env.ASSETS.fetch(new Request(new URL(pathname, assetOrigin)))
  if (first.status < 300 || first.status >= 400) return first
  const loc = first.headers.get('location') ?? ''
  const dest = loc.startsWith('http') ? new URL(loc).pathname : loc.split('?')[0] || loc
  if (dest === '/' || dest === '/index.html') {
    return env.ASSETS.fetch(new Request(new URL('/', assetOrigin)))
  }
  return first
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
    const url = new URL(request.url)
    applyEnv(env, url.hostname)
    if (isMizHost(url.hostname)) {
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
      if (url.pathname.startsWith('/api')) return handlePokerApi(request)
      return env.ASSETS.fetch(request)
    }
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
      return serveAsset(env, '/')
    }
    if (url.pathname.startsWith('/poker/')) {
      const stripped = url.pathname.slice('/poker'.length) || '/'
      const asset = await serveAsset(env, stripped)
      if (asset.status !== 404) return asset
      return serveAsset(env, '/')
    }
    return serveAsset(env, url.pathname || '/')
  },
}
