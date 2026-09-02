import { createServer } from 'node:http'
import { createHttp } from './http'
import { attachSocket } from './socket'
import { createBus } from './redisBus'
import { config } from './config'

async function main() {
  const app = createHttp()
  const httpServer = createServer(app)
  const bus = await createBus(config.redisUrl)
  attachSocket(httpServer, bus)
  httpServer.listen(config.port, () => {
    console.log(
      `Jub Poker listening on :${config.port} base=${config.basePath || '/'} redis=${bus.enabled}`,
    )
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
