import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const root = fileURLToPath(new URL('.', import.meta.url))
  const env = loadEnv(mode, root, '')
  return {
    envDir: root,
    plugins: [react()],
    define: {
      VITE_API_URL: JSON.stringify(env.VITE_API_URL),
      VITE_SOCKET_URL: JSON.stringify(env.VITE_SOCKET_URL)
    }
  }
})
