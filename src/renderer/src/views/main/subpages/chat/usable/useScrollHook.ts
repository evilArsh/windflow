import { ChatMessage, ChatTopicTree } from "@renderer/types"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import useChatStore from "@renderer/store/chat.store"
export default (
  contentLayout: Ref<InstanceType<typeof ContentLayout> | null>,
  topic: Ref<ChatTopicTree | undefined>,
  message: Ref<ChatMessage | undefined>
) => {
  const chatStore = useChatStore()
  const scrollY = ref(0)
  function scrollTo(topic: ChatTopicTree) {
    nextTick(() => {
      if (topic.node.scrollY) {
        contentLayout.value?.scrollTo("instant", topic.node.scrollY)
      } else {
        contentLayout.value?.scrollToBottom("instant")
      }
    })
  }
  function onScroll(_x: number, y: number) {
    scrollY.value = y
  }
  function setOldScrollY(topic: ChatTopicTree) {
    topic.node.scrollY = scrollY.value
    chatStore.dbUpdateChatTopic(topic.node)
  }

  watch(topic, (val, old) => {
    if (old) setOldScrollY(old) // switch tab
    if (val) scrollTo(val)
  })
  watch(
    message,
    (val, old) => {
      if (val && val === old) {
        if (!contentLayout.value?.isScrolling() && contentLayout.value?.arrivedState().bottom) {
          contentLayout.value?.scrollToBottom("smooth")
        }
      }
    },
    { deep: true }
  )

  onMounted(() => {
    if (topic.value) scrollTo(topic.value)
  })
  onBeforeUnmount(() => {
    if (topic.value) setOldScrollY(topic.value)
  })
  return {
    scrollY,
    scrollTo,
    onScroll,
  }
}
