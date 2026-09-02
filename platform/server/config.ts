function readEnv(name: string, fallback = ''): string {
  return process.env[name] ?? fallback
}

export const config = {
  get port(): number {
    return Number(readEnv('PORT', '8080'))
  },
  get jwtSecret(): string {
    return readEnv('JWT_SECRET', 'dev-only-change-me')
  },
  get redisUrl(): string {
    return readEnv('REDIS_URL')
  },
  get basePath(): string {
    return readEnv('BASE_PATH').replace(/\/$/, '')
  },
  get inviteTtlMs(): number {
    return Number(readEnv('INVITE_TTL_MS', String(15 * 60 * 1000)))
  },
  get turnMs(): number {
    return Number(readEnv('TURN_MS', '30000'))
  },
  get corsOrigin(): string | true {
    const raw = readEnv('CORS_ORIGIN')
    return raw || true
  },
  get publicUrl(): string {
    return readEnv('PUBLIC_URL', 'http://localhost:8080')
  },
  get serverless(): boolean {
    return Boolean(
      process.env.VERCEL ||
        process.env.AWS_LAMBDA_FUNCTION_NAME ||
        process.env.CLOUDFLARE_WORKER ||
        process.env.CF_PAGES,
    )
  },
}
