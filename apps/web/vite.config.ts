import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: Number(process.env.CLIENT_PORT) || 5173,
    // Bind mounts on Windows/Docker don't emit fs events; poll instead.
    watch: { usePolling: true },
  },
})
