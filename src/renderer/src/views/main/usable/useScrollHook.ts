import { ChatMessage, ChatTopicTree } from "@renderer/types"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"
import { useThrottleFn } from "@vueuse/core"
export default (
  contentLayout: Ref<InstanceType<typeof ContentLayout> | null>,
  topic: Ref<ChatTopicTree | undefined>,
  message: Ref<ChatMessage | undefined>
) => {
  function scrollTo(topic: ChatTopicTree) {
    if (topic.node.scrollY) {
      contentLayout.value?.scrollTo(topic.node.scrollY, "instant")
    } else {
      contentLayout.value?.scrollToBottom("instant")
    }
  }
  const onScroll = useThrottleFn((_x: number, y: number) => {
    if (topic.value) {
      topic.value.node.scrollY = y
    }
  }, 200)

  watch(
    topic,
    val => {
      nextTick(() => {
        val && scrollTo(val)
      })
    },
    { immediate: true }
  )
  watch(
    message,
    (val, old) => {
      nextTick(() => {
        if (val && val === old) {
          contentLayout.value?.scrollIfShould("smooth")
        }
      })
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
