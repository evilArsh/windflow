import useHotKey from "@renderer/usable/useHotKey"
import { ChatTopic, ChatTopicTree } from "@renderer/types"
export default (topic: Ref<ChatTopicTree | undefined>, options: { send: (topic?: ChatTopic) => void }) => {
  const { on: onHotKey, cleanAll, clean } = useHotKey()
  const sendShortcut = ref("ctrl+enter") // 发送快捷键

  watch(
    sendShortcut,
    (val, old) => {
      if (old) clean(old)
      onHotKey(val, res => {
        if (res.active) {
          options.send(topic.value?.node)
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
