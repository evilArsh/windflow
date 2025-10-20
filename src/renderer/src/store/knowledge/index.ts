import { defineStore } from "pinia"
import { Knowledge } from "@renderer/types/knowledge"
import { useData } from "./api"
import useRagFilesStore from "../ragFiles/index"
export default defineStore("knowledge", () => {
  const ragFilesStore = useRagFilesStore()
  const knowledges = reactive<Knowledge[]>([])
  const api = useData()

  async function remove(id: string) {
    // FIXME: transaction
    await api.remove(id)
    await ragFilesStore.removeAllByTopicId(id)
    const i = knowledges.findIndex(item => item.id === id)
    if (i < 0) return
    knowledges.splice(i, 1)
  }
  async function init() {
    knowledges.length = 0
    const data = await api.fetch()
    data.forEach(item => {
      knowledges.push(item)
    })
  }
  return {
    init,
    api,

    knowledges,
    remove,
  }
})
