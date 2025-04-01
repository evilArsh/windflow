import { ChatTopic, ChatMessage, Role } from "@renderer/types"
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/store/chat.store"
import { chatMessageDefault } from "@renderer/store/default/chat.default"
import { useThrottleFn } from "@vueuse/core"
export default (topic: Ref<ChatTopic>) => {
  const chatStore = useChatStore()
  const { chatMessage } = storeToRefs(chatStore)
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
  const refreshPrompt = useThrottleFn(
    (message: ChatMessage, prompt: string) => {
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
    },
    1000,
    true
  )

  watch(
    topic,
    async (val, oldVal) => {
      if (val === oldVal) {
        // TODO: 当models改变需要刷新llmChats
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
              data.data.forEach(item => {
                item.finish = true
                item.status = 200
              })
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
        chatStore.mountContext(val, message.value)
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
