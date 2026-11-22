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
      // The page registers the worker itself, in src/sw/registerServiceWorker.ts, so the plugin must not add a second registration
      injectRegister: false,
      includeAssets: ['icons/*.png', 'brand/*.png', 'favicon.png'],
      // We write our own service worker (src/sw/sw.ts) because we need Background Sync for the outbox
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'sw.ts',
      // Shows the service worker while running `npm run dev`, not only after a build
      devOptions: { enabled: true, type: 'module' },
      injectManifest: {
        // Include fonts and images in the offline copy of the app
        globPatterns: ['**/*.{js,css,html,png,woff2,webmanifest}'],
        // Skip alphabets the app never shows. Latin Extended is kept: it holds the macrons (ā, ē, ī, ō, ū) in Māori names.
        globIgnores: ['**/*cyrillic*', '**/*greek*', '**/*vietnamese*'],
      },
      manifest: {
        name: 'SiteReady NZ',
        short_name: 'SiteReady',
        description: 'Emergency equipment inspection management for NZ businesses',
        theme_color: '#1e3727',
        background_color: '#fcf9f6',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
