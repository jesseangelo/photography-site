import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])

// Builds { "<project-slug>": ["/images/<slug>/<file>", ...] } from public/images/.
// Served in dev and emitted as data/images-index.json in the build so the
// admin editor can offer a visual picker of the files actually on the site.
function scanImagesIndex() {
  const root = join(process.cwd(), 'public', 'images')
  const index = {}
  let dirs = []
  try { dirs = readdirSync(root, { withFileTypes: true }) } catch { return index }
  for (const dir of dirs) {
    if (!dir.isDirectory()) continue
    let files = []
    try { files = readdirSync(join(root, dir.name)) } catch { continue }
    index[dir.name] = files
      .filter(f => IMAGE_EXTS.has(f.slice(f.lastIndexOf('.')).toLowerCase()))
      .sort()
      .map(f => `/images/${dir.name}/${f}`)
  }
  return index
}

function imagesIndexPlugin() {
  return {
    name: 'images-index',
    configureServer(server) {
      server.middlewares.use('/data/images-index.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(scanImagesIndex()))
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'data/images-index.json',
        source: JSON.stringify(scanImagesIndex(), null, 2)
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), imagesIndexPlugin()]
})
