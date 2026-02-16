import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Stamps a content-based version into service-worker.js so the browser
// detects a new service worker on every build that changes output files.
function serviceWorkerVersion() {
  return {
    name: 'service-worker-version',
    writeBundle(options) {
      const outDir = options.dir || path.resolve(__dirname, 'dist')
      const swPath = path.join(outDir, 'service-worker.js')
      if (!fs.existsSync(swPath)) return

      // Hash all built assets (excluding the SW itself) to derive a version
      const files = fs.readdirSync(outDir, { recursive: true })
        .filter(f => f !== 'service-worker.js' && fs.statSync(path.join(outDir, f)).isFile())
        .sort()
      const hash = crypto.createHash('md5')
      for (const f of files) {
        hash.update(fs.readFileSync(path.join(outDir, f)))
      }
      const version = hash.digest('hex').slice(0, 10)

      let sw = fs.readFileSync(swPath, 'utf-8')
      sw = sw.replace('__SW_VERSION__', version)
      fs.writeFileSync(swPath, sw)
    }
  }
}

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
  plugins: [tsconfigPaths(), serviceWorkerVersion()],
})
