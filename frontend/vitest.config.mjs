// frontend/vitest.config.mjs
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // Simulates a browser environment in case you test components later
    globals: true,        // Automatically provides 'describe', 'it', 'expect' globally
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Maps your root source alias if you use it
    },
  },
})
