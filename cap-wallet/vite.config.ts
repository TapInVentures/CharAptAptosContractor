import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'aptos': 'aptos'
    }
  },
  optimizeDeps: {
    include: [
      'aptos',
      '@aptos-labs/wallet-adapter-ant-design',
      '@aptos-labs/wallet-adapter-react',
      '@aptos-labs/wallet-adapter-core',
      'antd'
    ]
  },
  build: {
    commonjsOptions: {
      include: []
    }
  }
}) 