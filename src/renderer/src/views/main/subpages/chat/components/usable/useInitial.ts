import { ChatTopic } from "@renderer/types"
import useModelStore from "@renderer/store/model.store"
export default (topic: Ref<ChatTopic>) => {
  const modelStore = useModelStore()

  const handleModelIds = () => {
    topic.value.modelIds = topic.value.modelIds.filter(val => {
      return modelStore.find(val)?.active
    })
  }
  watch(topic, handleModelIds, { immediate: true })
}
