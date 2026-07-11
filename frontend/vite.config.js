import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },

  build: {
    // Raise chunk warning threshold (our chunks are intentionally split)
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Manual chunk splitting — vendor libs load once and are cached
        manualChunks: {
          // React core — tiny, cached forever
          'react-vendor': ['react', 'react-dom'],
          // Router — separate chunk
          'router':       ['react-router-dom'],
          // Charts — large, only loaded on Dashboard page
          'charts':       ['recharts'],
          // Animations — only loaded when needed
          'motion':       ['framer-motion'],
          // HTTP client
          'axios':        ['axios'],
        }
      }
    }
  },

  // Optimize deps pre-bundling for faster cold starts
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'recharts',
      'axios',
    ]
  }
})
