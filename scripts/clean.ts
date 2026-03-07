import { execSync } from "node:child_process"
import fs from "node:fs/promises"

const result = execSync("git clean -Xdn", { encoding: "utf-8" })

const excludes = ["node_modules", ".vitepress", ".eslintcache", ".md", "public"]
const items = result
  .split("\n")
  .map(i => i.replace("Would remove ", "").trim())
  .filter(Boolean)
  .filter(i => i.startsWith("packages/") && !excludes.some(j => i.includes(j)))

for (const item of items) {
  console.log(`Removing ${item}`)
  await fs.rm(item, { force: true, recursive: true })
}
