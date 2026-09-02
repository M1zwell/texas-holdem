import { handlePokerApi } from '../../platform/server/fetchApi'

export default async (request: Request) => {
  process.env.BASE_PATH = ''
  process.env.PUBLIC_URL = process.env.PUBLIC_URL || 'https://miz.gg'
  process.env.CLOUDFLARE_WORKER = '1'
  if (
    process.env.SUPABASE_URL &&
    !process.env.SUPABASE_ANON_KEY &&
    process.env.VITE_SUPABASE_ANON_KEY
  ) {
    process.env.SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
  }
  return handlePokerApi(request)
}

export const config = {
  path: ['/api/*', '/poker/api/*'],
}
