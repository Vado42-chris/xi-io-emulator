import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Tauri loads dist/index.html via file:// — relative asset paths required.
  base: './',
  plugins: [react()],
})
