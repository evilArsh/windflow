import { ChatTopic, ChatMessage, Role } from "@renderer/types"
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/store/chat.store"
import { chatMessageDefault } from "@renderer/store/default/chat.default"
export default (topic: Ref<ChatTopic>) => {
  const chatStore = useChatStore()
  const { chatMessage } = storeToRefs(chatStore)
  const { llmChats } = storeToRefs(chatStore)
  const message = ref<ChatMessage>({
    id: "",
    data: [],
  })
  const newMessage = async (prompt: string) => {
    const msg = chatMessageDefault()
    msg.data[0].content.content = prompt
    msg.data[0].content.role = "system"
    await chatStore.dbAddChatMessage(msg)
    return msg
  }
  // 刷新prompt
  const refreshPrompt = (message: ChatMessage, prompt: string) => {
    const system = message.data.find(item => item.content.role == Role.System)
    if (message.data.length == 0 || !system) {
      const p = {
        id: uniqueId(),
        finish: true,
        status: 200,
        time: formatSecond(new Date()),
        content: { role: Role.System, content: prompt },
        modelId: "",
      }
      message.data.unshift(p)
    } else {
      system.content.content = prompt
    }
  }

  watch(
    topic,
    async (val, oldVal) => {
      if (val === oldVal) {
        refreshPrompt(message.value, val.prompt)
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
              message.value = await newMessage(val.prompt)
              topic.value.chatMessageId = message.value.id
              chatMessage.value[message.value.id] = message.value
            }
          }
        } else {
          message.value = await newMessage(val.prompt)
          val.chatMessageId = message.value.id
          chatMessage.value[message.value.id] = message.value
        }
        // 挂载上下文
        if (!llmChats.value[val.id]) {
          llmChats.value[val.id] = val.modelIds.map(modelId => {
            const m = chatMessage.value[message.value.id]
            return {
              modelId,
              message: m,
              provider: undefined,
              handler: undefined,
            }
          })
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
    // getMessageContext,
    // send,
  }
}
