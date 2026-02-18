import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Optimized Vite config: No Node.js path aliases to ensure compatibility with web containers
export default defineConfig({
  plugins: [react()],
  root: '.',
  base: './',
  server: {
    host: true,
    port: 3000
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})