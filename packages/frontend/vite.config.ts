import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:7007',
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: 'http://localhost:7007',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:7007',
        changeOrigin: true,
        secure: false,
      },
      '/webrtc': {
        target: 'http://localhost:7007',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
})
