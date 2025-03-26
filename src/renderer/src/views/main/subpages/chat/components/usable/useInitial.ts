import { ChatTopic } from "@renderer/types"
import useModelStore from "@renderer/store/model.store"
import { storeToRefs } from "pinia"
export default (topic: Ref<ChatTopic>) => {
  const modelStore = useModelStore()
  const { models } = storeToRefs(modelStore)

  watchEffect(() => {
    topic.value.modelIds = topic.value.modelIds.filter(val => {
      return models.value.find(v => v.id === val)?.active
    })
  })
}
