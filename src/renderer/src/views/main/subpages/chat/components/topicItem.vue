<script lang="ts">
export default {
  name: "RecursiveTopicItem",
}
</script>
<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
import ds from "@renderer/assets/images/provider/deepseek.svg"
defineProps<{
  topicList: ChatTopic[]
  level: number
  currentTopic?: ChatTopic
}>()
const emit = defineEmits<{
  (e: "select", topic: ChatTopic): void
}>()
const onItemSelect = (topic: ChatTopic) => {
  emit("select", topic)
}
</script>
<template>
  <div
    :style="{ paddingLeft: `${level * 2}rem` }"
    class="flex flex-col gap-1rem"
    v-for="topic in topicList"
    :key="topic.id">
    <Hover background still-lock :default-lock="currentTopic?.id === topic.id">
      <div class="group-item" @click="onItemSelect(topic)">
        <el-image class="group-item-icon" :src="ds" />
        <el-text class="group-item-name">{{ topic.label }}</el-text>
      </div>
    </Hover>
    <RecursiveTopicItem
      @select="onItemSelect"
      :topic-list="topic.children"
      :level="level + 1"
      :current-topic="currentTopic"></RecursiveTopicItem>
  </div>
</template>

<style lang="scss" scoped>
.group-item {
  --provider-container-icon-size: 3rem;

  display: flex;
  align-items: center;
  border-radius: 0.5rem;

  .group-item-icon {
    width: var(--provider-container-icon-size);
    height: var(--provider-container-icon-size);
  }
  .group-item-name {
    font-size: 1.2rem;
  }
}
</style>
