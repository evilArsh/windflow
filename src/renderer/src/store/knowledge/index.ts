import { defineStore } from "pinia"
import { Knowledge } from "@renderer/types/knowledge"
import { useData } from "./api"
import useRagFilesStore from "../ragFiles/index"
export default defineStore("knowledge", () => {
  const ragFilesStore = useRagFilesStore()
  const knowledges = reactive<Knowledge[]>([])
  const api = useData()

  async function init() {
    knowledges.length = 0
    const data = await api.fetch()
    knowledges.push(...data)
  }
  async function remove(id: string) {
    await api.remove(id)
    await ragFilesStore.removeAllByTopicId(id)
    const i = knowledges.findIndex(item => item.id === id)
    if (i < 0) return
    knowledges.splice(i, 1)
  }
  return {
    init,
    api,

    knowledges,
    remove,
  }
})
