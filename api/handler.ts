import type { IncomingMessage, ServerResponse } from 'node:http'
import { createHttp } from '../platform/server/http'

const app = createHttp()

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const url = req.url ?? '/'
  if (!url.startsWith('/api') && !url.startsWith('/poker/api')) {
    req.url = `/api${url.startsWith('/') ? url : `/${url}`}`
  }
  return app(req, res)
}
