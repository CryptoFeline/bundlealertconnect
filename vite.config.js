import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    base: '/',
    define: {
      // Explicitly define environment variables
      'import.meta.env.VITE_WALLETCONNECT_PROJECT_ID': JSON.stringify(env.VITE_WALLETCONNECT_PROJECT_ID),
      'import.meta.env.VITE_BOT_API_URL': JSON.stringify(env.VITE_BOT_API_URL),
      'import.meta.env.VITE_APP_DOMAIN': JSON.stringify(env.VITE_APP_DOMAIN),
      'import.meta.env.VITE_DEBUG_MODE': JSON.stringify(env.VITE_DEBUG_MODE)
    },
    build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          wallet: ['@walletconnect/ethereum-provider', 'ethers'],
          ui: ['@headlessui/react', 'framer-motion', '@heroicons/react']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'
  },
    preview: {
      port: 3000,
      host: '0.0.0.0'
    }
  }
})
