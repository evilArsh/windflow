import { execa } from "execa"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

async function runBuild() {
  try {
    console.log("[building] @windflow/shared start")
    await execa("pnpm", ["-F", "@windflow/shared", "build"], {
      cwd: resolve(__dirname, ".."),
      stdio: "inherit",
    })
    console.log("[building] @windflow/shared done")

    console.log("[building] electron-vite start")
    await execa("npm", ["run", "typecheck"], {
      cwd: resolve(__dirname, ".."),
      stdio: "inherit",
    })

    await execa("electron-vite", ["build"], {
      cwd: resolve(__dirname, ".."),
      stdio: "inherit",
    })
    console.log("[building] electron-vite done")
  } catch (error) {
    console.error("[build exception]", error)
    process.exit(1)
  }
}

async function buildUnpack() {
  try {
    await runBuild()
    console.log("[building] unpack start")
    await execa("electron-builder", ["--dir", "--config", "electron-builder.yml"], {
      cwd: resolve(__dirname, ".."),
      stdio: "inherit",
    })
    console.log("[building] unpack done")
  } catch (error) {
    console.error("[build:unpack exception]", error)
    process.exit(1)
  }
}

async function buildWin() {
  try {
    await runBuild()
    console.log("[building] windows start")
    await execa("electron-builder", ["--win", "--config", "electron-builder.yml"], {
      cwd: resolve(__dirname, ".."),
      stdio: "inherit",
    })
    console.log("[building] windows done")
  } catch (error) {
    console.error("[build:win exception]", error)
    process.exit(1)
  }
}

async function buildMac() {
  try {
    await runBuild()
    console.log("[building] mac start")
    await execa("electron-builder", ["--mac", "--config", "electron-builder.yml"], {
      cwd: resolve(__dirname, ".."),
      stdio: "inherit",
    })
    console.log("[building] mac done")
  } catch (error) {
    console.error("[build:mac exception]", error)
    process.exit(1)
  }
}

async function buildLinux() {
  try {
    await runBuild()
    console.log("[building] linux start")
    await execa("electron-builder", ["--linux", "--config", "electron-builder.yml"], {
      cwd: resolve(__dirname, ".."),
      stdio: "inherit",
    })
    console.log("[building] linux done")
  } catch (error) {
    console.error("[build:linux exception]", error)
    process.exit(1)
  }
}

const args = process.argv.slice(2)
const command = args[0]

switch (command) {
  case "build":
    runBuild()
    break
  case "build:unpack":
    buildUnpack()
    break
  case "build:win":
    buildWin()
    break
  case "build:mac":
    buildMac()
    break
  case "build:linux":
    buildLinux()
    break
  default:
    process.exit(1)
}
