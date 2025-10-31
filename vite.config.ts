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
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'FleetWise',
        short_name: 'Fleetz',
        description: 'Manage your fleet with ease!',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png', // Must be in your 'public' folder
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // Must be in your 'public' folder
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // Maskable icon
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