import { ToolEnvironment } from "@shared/types/env"

export const defaultEnv = (): ToolEnvironment => {
  return {
    npm: {
      registry: "https://registry.npmmirror.com",
      mirrors: [
        { label: "taobao", value: "https://registry.npmmirror.com" },
        { label: "npm", value: "https://registry.npmjs.org" },
      ],
    },
    uv: {
      path: "uv",
    },
    bun: {
      path: "bun",
    },
  }
}
