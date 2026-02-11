import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'iGestorPhone - Sistema de Automação Apple',
        short_name: 'iGestorPhone',
        description: 'Sistema inteligente de automação para lojistas Apple',
        theme_color: '#0A0E21',
        background_color: '#0A0E21',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'assets/images/favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'assets/images/favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '127.0.0.1', // evita erro uv_interface_addresses em alguns ambientes; use 0.0.0.0 para acesso na rede
    hmr: {
      overlay: true
    },
    cors: true,
    strictPort: false
  },
  build: {
    outDir: 'dist',
    sourcemap: import.meta.env.DEV,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/')) return 'vendor-react'
            if (id.includes('framer-motion')) return 'vendor-motion'
            if (id.includes('@tanstack/react-query')) return 'vendor-query'
            if (id.includes('axios')) return 'vendor-axios'
            if (id.includes('lucide-react')) return 'vendor-icons'
            return 'vendor'
          }
        }
      }
    }
  }
})
