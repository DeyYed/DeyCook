import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import serverlessApiPlugin from './vite.serverless-plugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), serverlessApiPlugin()],
  server: {
    // No proxy needed; /api handled in-process
    port: 5173,
  },
})
