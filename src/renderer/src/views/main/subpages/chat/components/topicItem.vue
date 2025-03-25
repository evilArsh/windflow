<script lang="ts">
export default {
  name: "RecursiveTopicItem",
}
</script>
<script lang="ts" setup>
import { ChatTopic } from "@renderer/types"
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
        <div class="group-item-icon">
          <Svg :src="topic.icon" class="text-18px"></Svg>
        </div>
        <el-text line-clamp="2" class="group-item-name">{{ topic.label }}</el-text>
        <div class="group-item-handle">
          <el-button circle size="small">
            <i-ic:outline-settings></i-ic:outline-settings>
          </el-button>
          <el-button circle type="danger" size="small">
            <i-ep:delete></i-ep:delete>
          </el-button>
        </div>
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
  --provider-container-icon-size: 2.5rem;

  display: flex;
  align-items: center;
  border-radius: 0.5rem;
  padding: 0.5rem;
  gap: 0.5rem;

  .group-item-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--provider-container-icon-size);
    height: var(--provider-container-icon-size);
  }
  .group-item-name {
    font-size: 1.2rem;
    flex: 1;
  }
  .group-item-handle {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
