import { execa } from "execa"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
async function runDev() {
  try {
    console.log("[building] @windflow/shared start")
    await execa("pnpm", ["-F", "@windflow/shared", "build"], {
      cwd: resolve(__dirname, ".."),
      stdio: "inherit",
    })
    console.log("[building] @windflow/shared done")
    console.log("[lanuching] electron-vite")
    const devProcess = execa("electron-vite", ["dev"], {
      cwd: resolve(__dirname, ".."),
      stdio: "inherit",
    })
    devProcess.on("error", err => {
      console.error("[lanuching error]:", err)
      process.exit(1)
    })
    devProcess.on("close", code => {
      console.log(`[exited]: ${code}`)
      process.exit(code || 0)
    })
    await devProcess
  } catch (error) {
    console.error("[exception]", error)
    process.exit(1)
  }
}
runDev()
