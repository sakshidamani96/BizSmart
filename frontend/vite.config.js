import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // With VITE_API_BASE_URL=/ in .env.local, API calls go to the local Spring Boot backend
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 700
  }
})
