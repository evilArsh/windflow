import { ChatMessage, ChatTopicTree } from "@renderer/types"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import { useDebounceFn } from "@vueuse/core"
export default (
  contentLayout: Ref<InstanceType<typeof ContentLayout> | null>,
  topic: Ref<ChatTopicTree | undefined>,
  message: Ref<ChatMessage | undefined>
) => {
  function scrollTo(topic: ChatTopicTree) {
    setTimeout(() => {
      if (topic.node.scrollY) {
        contentLayout.value?.scrollTo("instant", topic.node.scrollY)
      } else {
        contentLayout.value?.scrollToBottom("instant")
      }
    }, 0)
  }
  const onScroll = useDebounceFn((_x: number, y: number) => {
    if (topic.value) {
      topic.value.node.scrollY = y
    }
  }, 500)

  watch(topic, (val, old) => {
    if (val && val !== old) {
      scrollTo(val)
    }
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
  return {
    onScroll,
  }
}
