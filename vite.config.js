import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  root: 'src',
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      'terraria-world-file/browser': path.resolve(__dirname, 'terraria-world-file-ts/src/platform/browser.ts'),
      'terraria-world-file': path.resolve(__dirname, 'terraria-world-file-ts/src/index.ts'),
    },
  },
  worker: {
    format: 'es',
    plugins: () => [tsconfigPaths()],
  },
  plugins: [tsconfigPaths()],
})
