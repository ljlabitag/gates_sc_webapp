import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        // wrangler dev's default port — run `npm run dev` from the repo root
        // to start both this and the Worker together.
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
