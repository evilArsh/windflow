import { defineConfig } from "vite"
import path from "node:path"
import { fileURLToPath } from "node:url"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  resolve: {
    alias: [{ find: "@", replacement: path.resolve("./src") }],
  },
  optimizeDeps: {
    disabled: true,
  },
})
