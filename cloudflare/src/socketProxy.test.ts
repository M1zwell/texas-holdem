import { describe, expect, it } from 'vitest'
import { proxySocketToFly } from './worker'

describe('hybrid Socket.IO proxy', () => {
  it('rewrites the Host header to the Fly origin and keeps the /poker/socket.io path', async () => {
    const seen: { url: string; host: string }[] = []
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const req = input instanceof Request ? input : new Request(String(input))
      seen.push({ url: req.url, host: req.headers.get('host') ?? '' })
      return new Response('ok', { status: 200 })
    }) as typeof fetch
    try {
      const res = await proxySocketToFly(
        new Request('https://jubuddy.com/poker/socket.io/?EIO=4&transport=polling', {
          headers: { host: 'jubuddy.com' },
        }),
        'https://jub-poker.fly.dev',
      )
      expect(res.status).toBe(200)
      expect(seen[0]?.url).toBe(
        'https://jub-poker.fly.dev/poker/socket.io/?EIO=4&transport=polling',
      )
      expect(seen[0]?.host).toBe('jub-poker.fly.dev')
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
