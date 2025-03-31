import useHotKey from "@renderer/usable/useHotKey"
import { ChatMessage, ChatTopic } from "@renderer/types"
export default (topic: Ref<ChatTopic>, message: Ref<ChatMessage>, options: { send: CallBackFn }) => {
  const { on: onHotKey, cleanAll, clean } = useHotKey()
  const sendShortcut = ref("ctrl+enter") // 发送快捷键

  watch(
    sendShortcut,
    (val, old) => {
      if (old) clean(old)
      onHotKey(val, res => {
        if (res.active) {
          options.send(topic.value, message.value)
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
