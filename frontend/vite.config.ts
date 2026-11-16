import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// Vite configuration for SiteReady NZ PWA
export default defineConfig({
  resolve: {
    alias: {
      // "@/components/..." instead of "../../components/..." (also what ShadCN expects)
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      // Automatically updates the service worker when new content is available
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      // Lets us see the service worker while running `npm run dev`, not only after a build
      devOptions: { enabled: true },
      manifest: {
        name: 'SiteReady NZ',
        short_name: 'SiteReady',
        description: 'Emergency equipment inspection management for NZ businesses',
        theme_color: '#1f5a43',
        background_color: '#f5f3ee',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // Single-page app: any unknown URL (e.g. /dashboard on refresh, offline) serves index.html
        navigateFallback: '/index.html',
        // Never serve the app shell for backend routes such as Google sign-in
        navigateFallbackDenylist: [/^\/auth\//, /^\/api\//],
        // Cache API responses Network-First so offline users get the last-known data
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
})
