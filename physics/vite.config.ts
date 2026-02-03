import { defineConfig } from 'vite'

export default defineConfig({
  base: '/creative-coding/',
  build: {
    outDir: '../docs',
    emptyOutDir: true
  }
})
