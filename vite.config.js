import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 1. CRITICAL FOR ITCH.IO: Makes paths relative so they work in a subdirectory
  base: './', 
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // 2. CRITICAL FOR VPS: Exposes the server to the internet
  server: {
    host: '0.0.0.0', 
    port: 5173,
    watch: {
      usePolling: true // Optional: Helps if editing files over certain SSH mounts
    }
  }
})