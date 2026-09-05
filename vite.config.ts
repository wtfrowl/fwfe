import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'  // <-- 1. Add this import

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),

    // 2. Add the VitePWA plugin configuration
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon/favicon.ico', 'icon/apple-touch-icon.png', 'icon/favicon-16x16.png', 'icon/favicon-32x32.png'],

      workbox: {
        /* Push and notification-click handlers. Pulled into the generated
           worker rather than replacing it: switching to `injectManifest` to
           add two listeners would mean owning precaching and update handling
           by hand, for no benefit. The file is served from `public/`, so its
           URL is stable and it is not hashed by the build. */
        importScripts: ['/push-sw.js'],

        /* A driver's phone caches the whole shell; the API is deliberately
           not cached here — stale trip and expense data presented as current
           is worse than an honest failure. */
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: {
        name: 'FleetWise',
        short_name: 'Fleetz',
        description: 'Manage your fleet with ease!',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icon/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon/android-chrome-512x512.png', // Maskable icon
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
      }
    })
  ],

  server: {
    // This allows the server to be accessible from other devices (like your phone)
    host: true, 
    
    // This allows the ngrok public hostname to be proxied to your Vite dev server
    // Note: Do NOT include 'https://' here.
    cors: true,
    allowedHosts: [
      'breakfastless-gianni-overtightly.ngrok-free.dev', 
      'localhost', // Always good to include localhost
      '127.0.0.1'  // Also good to include the loopback address
    ]
  }
})