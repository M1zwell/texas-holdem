import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['platform/**/__tests__/**/*.test.ts', 'cloudflare/**/*.test.ts'],
    environment: 'node',
  },
})
