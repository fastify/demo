import { resolve } from 'node:path'
import viteReact from '@vitejs/plugin-react'

/** @type {import('vite').UserConfig} */
export default {
  base: '/',
  root: resolve(import.meta.dirname, 'client'),
  build: {
    emptyOutDir: true,
    outDir: resolve(import.meta.dirname, 'dist/client')
  },
  plugins: [viteReact()]
}
