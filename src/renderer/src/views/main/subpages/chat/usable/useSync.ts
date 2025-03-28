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
    refreshPrompt()
    chatMessage.value[message.value.id] = message.value
    topic.value.chatMessageId = message.value.id
    await chatStore.dbAddChatMessage(message.value)
  }

  // 刷新prompt
  const refreshPrompt = () => {
    if (message.value.data.length == 0) {
      message.value.data.push({
        id: uniqueId(),
        finish: true,
        status: 200,
        time: formatSecond(new Date()),
        content: { role: "system", content: "" },
        modelId: "",
      })
    }
    message.value.data[0].content.content = topic.value.prompt
  }
  watch(
    topic,
    async () => {
      // 筛选可用modelId
      topic.value.modelIds = topic.value.modelIds.filter(val => {
        return models.value.find(v => v.id === val)?.active
      })
      if (topic.value.chatMessageId) {
        const cached = chatMessage.value[topic.value.chatMessageId]
        if (cached) {
          message.value = cached
          refreshPrompt()
        } else {
          const data = await chatStore.dbFindChatMessage(topic.value.chatMessageId)
          if (data) {
            chatMessage.value[topic.value.chatMessageId] = data
            message.value = data
            refreshPrompt()
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
    async (val, old) => {
      if (val.id && val === old) {
        await chatStore.dbUpdateChatMessage(val)
      }
    },
    { deep: true }
  )
  return {
    message,
  }
}
