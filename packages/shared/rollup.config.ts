import { defineConfig } from "rollup"
import esbuild from "rollup-plugin-esbuild"
import dts from "rollup-plugin-dts"
import json from "@rollup/plugin-json"
const external = [/ajv*/, /@toolmain*/]
export default defineConfig([
  {
    input: ["src/index.ts"],
    output: [
      {
        file: "dist/index.mjs",
        format: "esm",
      },
    ],
    plugins: [esbuild(), json()],
    external,
  },
  {
    input: ["src/index.ts"],
    output: [
      {
        file: "dist/index.d.mts",
      },
    ],
    plugins: [dts()],
    external,
  },
])
