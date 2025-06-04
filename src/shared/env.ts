import { ToolEnvironment } from "./types/env"

export const defaultEnv = (): ToolEnvironment => {
  return {
    npm: {
      registry: "https://registry.npmmirror.com",
      mirrors: [
        { label: "*official", value: "https://registry.npmjs.org" },
        { label: "taobao", value: "https://registry.npmmirror.com" },
      ],
    },
    python: {
      registry: "https://pypi.tuna.tsinghua.edu.cn/simple/",
      mirrors: [
        { label: "*official", value: "https://pypi.org/simple/" },
        { label: "tsinghua", value: "https://pypi.tuna.tsinghua.edu.cn/simple/" },
        { label: "alibaba", value: "https://mirrors.aliyun.com/pypi/simple/" },
        { label: "tencent", value: "https://mirrors.cloud.tencent.com/pypi/simple/" },
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
