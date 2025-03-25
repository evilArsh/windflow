<script lang="ts" setup>
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/store/chat.store"
import { ChatTopic } from "@renderer/types"
import TopicItem from "./topicItem.vue"
import NewTopic from "./toolbox/newTopic/index.vue"
const emit = defineEmits<{
  (e: "select", topic: ChatTopic): void
}>()
const charStore = useChatStore()
const { topicList } = storeToRefs(charStore)
const currentTopic = shallowRef<ChatTopic>()

const onItemSelect = (topic: ChatTopic) => {
  currentTopic.value = topic
  emit("select", topic)
}
const onNewTopicCreate = (id: string) => {
  const topic = charStore.find(id)
  if (topic) {
    onItemSelect(topic)
  }
}
onMounted(async () => {
  await nextTick()
  // 默认点击
  if (topicList.value.length > 0) {
    onItemSelect(topicList.value[0])
  }
})
</script>
<template>
  <div class="provider-container">
    <div class="flex flex-col gap-1rem">
      <TopicItem :topic-list="topicList" :level="0" @select="onItemSelect" :current-topic="currentTopic"></TopicItem>
    </div>
    <NewTopic @create="onNewTopicCreate"></NewTopic>
  </div>
</template>

<style lang="scss" scoped>
.provider-container {
  --provider-container-padding: 1rem;

  --el-menu-base-level-padding: 1rem;
  --el-menu-level-padding: 2rem;
  --el-menu-item-height: 4rem;
  --el-menu-sub-item-height: 4rem;

  padding: var(--provider-container-padding);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
