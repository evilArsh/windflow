import useHotKey from "@renderer/usable/useHotKey"
import { ChatMessage, ChatTopic, ChatTopicTree } from "@renderer/types"
export default (
  topic: Ref<ChatTopicTree | undefined>,
  message: Ref<ChatMessage | undefined>,
  options: { send: (topic?: ChatTopic, message?: ChatMessage) => void }
) => {
  const { on: onHotKey, cleanAll, clean } = useHotKey()
  const sendShortcut = ref("ctrl+enter") // 发送快捷键

  watch(
    sendShortcut,
    (val, old) => {
      if (old) clean(old)
      onHotKey(val, res => {
        if (res.active) {
          options.send(topic.value?.node, message.value)
        }
      })
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    cleanAll()
  })
  return {
    sendShortcut,
  }
}
