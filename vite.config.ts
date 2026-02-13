import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // This trick mocks the "process" variable for the browser
    'process.env': {}
  },
  base: './' // Ensures assets load correctly from any folder
})