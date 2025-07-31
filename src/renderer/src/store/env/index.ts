import { ToolEnvironment } from "@shared/types/env"
import { defineStore } from "pinia"
import { CallBackFn } from "@renderer/lib/shared/types"
import { useData } from "./data"
import { defaultEnv } from "@shared/env"

export default defineStore("env", () => {
  const env = reactive<ToolEnvironment>(defaultEnv())
  const api = useData(env)

  async function checkEnv(cb?: CallBackFn) {
    if (window.api.mcp) {
      const res = await window.api.env.testEnv(structuredClone(env))
      env.bun.status = res.data.bun.status
      env.bun.version = res.data.bun.msg ?? ""
      env.uv.status = res.data.uv.status
      env.uv.version = res.data.uv.msg ?? ""
    }
    cb?.()
  }

  return {
    env,
    checkEnv,
    api,
  }
})
