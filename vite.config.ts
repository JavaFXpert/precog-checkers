import { defineConfig } from 'vite'

export default defineConfig({
  base: '/precog-checkers/',
  build: {
    outDir: 'dist',
  },
  server: {
    open: true,
  },
})
