import { ChatTopic, ChatMessage } from "@renderer/types"
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/store/chat.store"
import { chatMessageDefault } from "@renderer/store/default/chat.default"
export default (topic: Ref<ChatTopic>) => {
  const chatStore = useChatStore()
  const { chatMessage } = storeToRefs(chatStore)
  const message = ref<ChatMessage>({
    id: "",
    data: [],
  })

  const newMessage = async () => {
    message.value = chatMessageDefault()
    message.value.data[0].content.content = topic.value.prompt
    message.value.data[0].content.role = "system"
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
        content: { role: "system", content: topic.value.prompt },
        modelId: "",
      })
    }
    const system = message.value.data.find(item => item.content.role == "system")
    if (system) {
      system.content.content = topic.value.prompt
    }
  }

  watch(
    topic,
    async (val, oldVal) => {
      if (val === oldVal) {
        refreshPrompt()
      }
      // 切换聊天时触发
      else {
        if (val.chatMessageId) {
          const cached = chatMessage.value[val.chatMessageId]
          if (cached) {
            message.value = cached
          } else {
            const data = await chatStore.dbFindChatMessage(val.chatMessageId)
            if (data) {
              chatMessage.value[val.chatMessageId] = data
              message.value = data
            } else {
              await newMessage()
            }
          }
        } else {
          await newMessage()
        }
      }
    },
    { immediate: true, deep: true }
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
