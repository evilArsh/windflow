import { ChatTopic, ChatMessage } from "@renderer/types"
import useModelStore from "@renderer/store/model.store"
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/store/chat.store"
import { chatMessageDefault } from "@renderer/store/default/chat.default"
export default (topic: Ref<ChatTopic>) => {
  const modelStore = useModelStore()
  const { models } = storeToRefs(modelStore)
  const chatStore = useChatStore()
  const { chatMessage } = storeToRefs(chatStore)
  const message = ref<ChatMessage>({
    id: "",
    data: [],
  })

  const newMessage = async () => {
    message.value = chatMessageDefault()
    chatMessage.value[message.value.id] = message.value
    topic.value.chatMessageId = message.value.id
    await chatStore.dbAddChatMessage(message.value)
  }

  watch(
    topic,
    async () => {
      topic.value.modelIds = topic.value.modelIds.filter(val => {
        return models.value.find(v => v.id === val)?.active
      })
      if (topic.value.chatMessageId) {
        const cached = chatMessage.value[topic.value.chatMessageId]
        if (cached) {
          message.value = cached
        } else {
          const data = await chatStore.dbFindChatMessage(topic.value.chatMessageId)
          if (data) {
            chatMessage.value[topic.value.chatMessageId] = data
            message.value = data
          } else {
            await newMessage()
          }
        }
      } else {
        await newMessage()
      }
    },
    { immediate: true }
  )

  watch(
    message,
    async val => {
      if (val.id) {
        await chatStore.dbUpdateChatMessage(message.value)
      }
    },
    { deep: true }
  )
  return {
    message,
  }
}
