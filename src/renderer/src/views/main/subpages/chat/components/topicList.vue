<script lang="ts" setup>
import ds from "@renderer/assets/images/provider/deepseek.svg"
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/pinia/chat.store"
import useProviderStore from "@renderer/pinia/provider.store"
import { ChatTopic } from "@renderer/types"
import TopicItem from "./topicItem.vue"
const emit = defineEmits<{
  (e: "select", topic: ChatTopic): void
}>()
const charStore = useChatStore()
const providerStore = useProviderStore()
const { topicList } = storeToRefs(charStore)
const { defaultProviderId } = storeToRefs(providerStore)
const currentTopic = shallowRef<ChatTopic>()
const onAddNewChat = () => {
  charStore.addGroup({
    id: uniqueId(),
    label: "DeepSeek",
    icon: ds,
    providers: [defaultProviderId.value],
    children: [],
    content: "",
    chatMessages: [],
  })
}
const onItemSelect = (topic: ChatTopic) => {
  currentTopic.value = topic
  emit("select", topic)
}
onMounted(() => {
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
    <Hover>
      <el-card shadow="never" @click="onAddNewChat" style="--el-card-padding: 0.3rem">
        <div class="flex items-center b-rd-0.5rem">
          <el-button size="small" type="primary" plain circle text>
            <i class="text-1.5rem i-ep:plus"></i>
          </el-button>
          <el-text class="text-1.2rem">{{ $t("chat.addChat") }}</el-text>
        </div>
      </el-card>
    </Hover>
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
