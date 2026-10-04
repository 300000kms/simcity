import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './', // rutas relativas: funciona en GitHub Pages bajo /simcity/
  plugins: [vue()],
  worker: { format: 'es' },
  test: {
    include: ['tests/**/*.test.js'],
    environment: 'node',
    testTimeout: 20000
  }
})
