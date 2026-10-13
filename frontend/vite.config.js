import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // reachable from outside the container when running in Docker (dev)
    watch: { usePolling: process.env.VITE_USE_POLLING === 'true' }, // file watching on Windows/macOS Docker
  },
})
