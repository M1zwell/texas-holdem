import { EventEmitter } from 'node:events'

export interface Bus {
  publish(channel: string, message: string): Promise<void>
  subscribe(channel: string, handler: (message: string) => void): Promise<void>
  enabled: boolean
}

class MemoryBus extends EventEmitter implements Bus {
  enabled = false
  async publish(channel: string, message: string): Promise<void> {
    this.emit(channel, message)
  }
  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    this.on(channel, handler)
  }
}

/**
 * Dual-client Redis pub/sub. A subscribed connection cannot publish,
 * so every node keeps pubClient and subClient separate (industry backplane).
 */
export async function createBus(redisUrl: string): Promise<Bus> {
  if (!redisUrl) {
    return new MemoryBus()
  }
  try {
    const redis = await import('redis')
    const pubClient = redis.createClient({ url: redisUrl })
    const subClient = pubClient.duplicate()
    pubClient.on('error', (err: Error) => console.error('redis pub', err.message))
    subClient.on('error', (err: Error) => console.error('redis sub', err.message))
    await pubClient.connect()
    await subClient.connect()
    return {
      enabled: true,
      publish: async (channel, message) => {
        await pubClient.publish(channel, message)
      },
      subscribe: async (channel, handler) => {
        await subClient.subscribe(channel, handler)
      },
    }
  } catch (err) {
    console.warn('Redis unavailable, falling back to in-process bus', err)
    return new MemoryBus()
  }
}
