import { ChatMessage, ChatTopic } from "@renderer/types"
import ContentLayout from "@renderer/components/ContentLayout/index.vue"

export default (
  contentLayout: Ref<InstanceType<typeof ContentLayout> | null>,
  topic: Ref<ChatTopic>,
  message: Ref<ChatMessage>
) => {
  const scrollY = ref(0)
  function scrollTo(topic: ChatTopic) {
    nextTick(() => {
      if (topic.scrollY) {
        contentLayout.value?.scrollTo("instant", topic.scrollY)
      } else {
        contentLayout.value?.scrollToBottom("instant")
      }
    })
  }
  function onScroll(_x: number, y: number) {
    scrollY.value = y
  }
  function setOldScrollY(topic: ChatTopic) {
    topic.scrollY = scrollY.value
  }

  watch(topic, (val, old) => {
    if (old) setOldScrollY(old) // switch tab
    scrollTo(val)
  })
  watch(
    message,
    () => {
      if (!contentLayout.value?.isScrolling() && contentLayout.value?.arrivedState().bottom) {
        contentLayout.value?.scrollToBottom("smooth")
      }
    },
    { deep: true }
  )

  onMounted(() => {
    scrollTo(topic.value)
  })
  onBeforeUnmount(() => {
    setOldScrollY(topic.value)
  })
  return {
    scrollY,
    scrollTo,
    onScroll,
    setOldScrollY,
  }
}
