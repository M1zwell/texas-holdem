import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const base = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  root: path.resolve(__dirname),
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '@engine': path.resolve(__dirname, '../engine'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8080',
      '/poker/api': 'http://127.0.0.1:8080',
      '/socket.io': { target: 'http://127.0.0.1:8080', ws: true },
      '/poker/socket.io': { target: 'http://127.0.0.1:8080', ws: true },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
