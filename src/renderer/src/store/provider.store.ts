import { ProviderMeta } from "@renderer/types"
import { defineStore } from "pinia"
import { providerDefault } from "./default/provider.default"
import { ProviderManager } from "@renderer/lib/provider"
import { storeKey, useDatabase } from "@renderer/usable/useDatabase"
import { useDebounceFn } from "@vueuse/core"
export default defineStore(storeKey.provider, () => {
  const { getAll, add, put } = useDatabase()
  const metas = reactive<ProviderMeta[]>([])
  const manager = markRaw<ProviderManager>(new ProviderManager())

  const dbUpdate = useDebounceFn(async (data: ProviderMeta) => await put("provider", data.name, toRaw(data)), 300, {
    maxWait: 1000,
  })

  const fetch = async () => {
    try {
      const data = await getAll<ProviderMeta>("provider")
      if (data.length > 0) {
        metas.push(...data)
      } else {
        const data = providerDefault()
        metas.push(...data)
        for (const item of data) {
          await add("provider", item)
        }
      }
    } catch (error) {
      console.error(`[fetch providers] ${(error as Error).message}`)
    }
  }

  fetch()
  return {
    dbUpdate,
    providerMetas: metas,
    providerManager: manager,
  }
})
