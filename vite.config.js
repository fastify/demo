import { join } from 'node:path'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fastifyReact from '@fastify/react/plugin'

export default {
  root: join(import.meta.dirname, 'src', 'client'),
  plugins: [
    viteReact(),
    fastifyReact({ ts: true }),
    tailwindcss()
  ],
  build: {
    emptyOutDir: true,
    // Forces Vite to use a top-level dist folder,
    // outside the project root defined above
    outDir: join(import.meta.dirname, 'dist')
  }
}
