export const config = {
  port: Number(process.env.PORT ?? 8080),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-change-me',
  redisUrl: process.env.REDIS_URL ?? '',
  basePath: (process.env.BASE_PATH ?? '').replace(/\/$/, ''),
  inviteTtlMs: Number(process.env.INVITE_TTL_MS ?? 15 * 60 * 1000),
  turnMs: Number(process.env.TURN_MS ?? 30_000),
  corsOrigin: process.env.CORS_ORIGIN ?? true,
  publicUrl: process.env.PUBLIC_URL ?? 'http://localhost:8080',
}
