import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function buildApiProxy(mode) {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || ''
  const devProxyPath = '/dooh-api'

  if (!/^https?:\/\//i.test(apiBaseUrl)) {
    return undefined
  }

  try {
    const apiUrl = new URL(apiBaseUrl)
    const upstreamPath = apiUrl.pathname.replace(/\/$/, '')

    if (!upstreamPath) {
      return undefined
    }

    return {
      [devProxyPath]: {
        target: apiUrl.origin,
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) => requestPath.replace(/^\/dooh-api/, upstreamPath)
      }
    }
  } catch {
    return undefined
  }
}

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/Dooh/' : '/',
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: buildApiProxy(mode)
  }
}))
