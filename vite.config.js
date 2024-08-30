import { defineConfig,  } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),],
  build: {
    outDir: './build'
  },
  resolve: {
    alias: [
      { find: "~", replacement: resolve(__dirname, "./src") }
    ]
  },
  // for dev
  server: {
    port: 3000,
  },
})
