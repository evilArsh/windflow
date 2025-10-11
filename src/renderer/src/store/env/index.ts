import { ToolEnvironment } from "@shared/types/env"
import { defineStore } from "pinia"
import { CallBackFn } from "@toolmain/shared"
import { useData } from "./data"
import { defaultEnv } from "@shared/env"
import { cloneDeep } from "@toolmain/shared"

export default defineStore("env", () => {
  const env = reactive<ToolEnvironment>(defaultEnv())
  const api = useData(env)

  async function checkEnv(cb?: CallBackFn) {
    if (window.api.mcp) {
      const res = await window.api.mcp.testEnv(cloneDeep(env))
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
