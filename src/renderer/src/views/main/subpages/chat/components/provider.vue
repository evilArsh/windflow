<script lang="ts" setup>
import ds from "@renderer/assets/images/provider/deepseek.svg"
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/pinia/chat.store"
import { ChatTopic } from "@renderer/types"
const charStore = useChatStore()
const { topicList } = storeToRefs(charStore)
const onAddNewChat = () => {
  charStore.addGroup({
    id: uniqueId(),
    label: "DeepSeek",
    icon: ds,
    topic: "DeepSeek",
    providers: [],
    children: [],
  })
}
const onItemSelect = (topic: ChatTopic) => {
  console.log(topic)
}
</script>
<template>
  <div class="provider-container">
    <div class="flex flex-col gap-1rem">
      <div class="flex flex-col gap-1rem" v-for="group in topicList" :key="group.id">
        <Hover background>
          <div class="group-item">
            <el-image class="group-item-icon" :src="ds" />
            <el-text class="group-item-name">{{ group.label }}</el-text>
          </div>
        </Hover>
        <div class="p-l-2rem" v-for="topic in group.children" :key="topic.id">
          <Hover background>
            <div class="group-item">
              <el-image class="group-item-icon" :src="ds" />
              <el-text class="group-item-name">{{ group.label }}</el-text>
            </div>
          </Hover>
        </div>
      </div>
    </div>
    <Hover>
      <el-card shadow="never" @click="onAddNewChat" style="--el-card-padding: var(--group-item-padding)">
        <div class="group-item">
          <el-button size="small" type="primary" plain circle text>
            <i class="text-1.5rem i-ep:plus"></i>
          </el-button>
          <el-text class="group-item-name">{{ $t("chat.addChat") }}</el-text>
        </div>
      </el-card>
    </Hover>
  </div>
</template>

<style lang="scss" scoped>
.provider-container {
  --provider-container-padding: 1rem;
  --provider-container-icon-size: 3rem;
  --group-item-padding: 0.3rem;
  --el-menu-base-level-padding: 1rem;
  --el-menu-level-padding: 2rem;
  --el-menu-item-height: 4rem;
  --el-menu-sub-item-height: 4rem;

  padding: var(--provider-container-padding);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  .group-item {
    display: flex;
    align-items: center;
    border-radius: 0.5rem;
  }
  .group-item-icon {
    width: var(--provider-container-icon-size);
    height: var(--provider-container-icon-size);
  }
  .group-item-name {
    font-size: 1.2rem;
  }
}
</style>
