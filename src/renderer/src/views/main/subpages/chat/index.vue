<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import TopicList from "./components/topicList.vue"
import { ChatTopic } from "@renderer/types"
import ChatContent from "./components/chat-content.vue"
// import useChatStore from "@renderer/pinia/chat.store"
// import { storeToRefs } from "pinia"
// const charStore = useChatStore()
// const { topicList } = storeToRefs(charStore)
const keyword = ref<string>("")
const currentTopic = ref<ChatTopic>()

const onTopicSelect = (topic: ChatTopic) => {
  currentTopic.value = topic
}
</script>
<template>
  <SubNavLayout>
    <template #submenu>
      <div class="chat-provider-header">
        <el-input v-model="keyword" placeholder="搜索"></el-input>
      </div>
      <div class="chat-provider-content">
        <el-scrollbar>
          <TopicList @select="onTopicSelect"></TopicList>
        </el-scrollbar>
      </div>
    </template>
    <template #content>
      <ChatContent v-if="currentTopic" v-model="currentTopic" />
    </template>
  </SubNavLayout>
</template>
<style lang="scss" scoped>
.chat-provider-header {
  --chat-container-padding: 0.25rem;

  flex-shrink: 0;
  flex-direction: column;
  display: flex;
  padding: var(--chat-container-padding);
  gap: 0.5rem;
}
.chat-provider-content {
  flex: 1;
  overflow: hidden;
}
</style>
