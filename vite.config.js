import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Menambahkan domain untuk mode development (npm run dev)
    allowedHosts: [
      'ib-myp.milbos.net'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    // Menambahkan domain untuk mode preview hasil build (npm run preview)
    allowedHosts: [
      'ib-myp.milbos.net'
    ]
  }
})
