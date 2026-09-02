/**
 * Route on jubuddy.com/poker* (Cloudflare Worker).
 * Keeps the /poker prefix so Vite BASE_URL and /poker/api stay same-origin.
 *
 * wrangler secret / vars:
 *   POKER_ORIGIN = jub-poker.vercel.app   (or the current Vercel hostname)
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/poker')) {
      return fetch(request)
    }
    const origin = env.POKER_ORIGIN || 'jub-poker.vercel.app'
    const dest = new URL(request.url)
    dest.hostname = origin
    dest.protocol = 'https:'
    dest.port = ''
    const headers = new Headers(request.headers)
    headers.set('host', origin)
    return fetch(
      new Request(dest.toString(), {
        method: request.method,
        headers,
        body: request.body,
        redirect: 'manual',
      }),
    )
  },
}
