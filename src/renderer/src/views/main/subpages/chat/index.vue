<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import { ChatTopic } from "@renderer/types"
import ChatContent from "./components/chat-content.vue"
import useChatStore from "@renderer/store/chat.store"
import { storeToRefs } from "pinia"
import EditTopic from "./components/toolbox/editTopic/index.vue"
const { t } = useI18n()
const keyword = ref<string>("")
const currentTopic = ref<ChatTopic>() //TODO: 分离聊天记录
const charStore = useChatStore()
const { topicList } = storeToRefs(charStore)

const onNewTopicCreate = (data: ChatTopic) => {
  charStore.add(data)
  currentTopic.value = data
}

const tree = reactive({
  props: {
    label: "label",
    children: "children",
    isLeaf: "isLeaf",
  },
  onNodeClick: markRaw((data: ChatTopic) => {
    currentTopic.value = data
  }),
})
</script>
<template>
  <SubNavLayout>
    <template #submenu>
      <div class="chat-provider-header">
        <el-input v-model="keyword" :placeholder="t('chat.search')" />
        <EditTopic @change="onNewTopicCreate"></EditTopic>
      </div>
      <div class="chat-provider-content">
        <el-scrollbar>
          <el-tree @node-click="tree.onNodeClick" :data="topicList" node-key="id" :props="tree.props">
            <template #default="{ data }: { data: ChatTopic }">
              <div class="chat-tree-node">
                <div class="chat-tree-icon">
                  <Svg :src="data.icon" class="text-18px"></Svg>
                </div>
                <el-text line-clamp="2" class="chat-tree-label">{{ data.label }}</el-text>
                <div class="chat-tree-handle">
                  <el-popover placement="right" :width="100" trigger="click">
                    <template #reference>
                      <el-button @click="currentTopic = data" circle text size="small" plain>
                        <i-ic:baseline-more-horiz></i-ic:baseline-more-horiz>
                      </el-button>
                    </template>
                    <div class="flex flex-col gap-0.5rem">
                      <EditTopic v-model="currentTopic">
                        <template #default="{ pop }">
                          <el-button @click="pop.toggle">
                            <template #icon>
                              <i class="text-1.4rem i-ep:edit"></i>
                            </template>
                            <el-text>{{ t("chat.editChat") }}</el-text>
                          </el-button>
                        </template>
                      </EditTopic>
                    </div>
                  </el-popover>
                </div>
              </div>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>
    </template>
    <template #content v-if="currentTopic">
      <ChatContent v-model="currentTopic" />
    </template>
  </SubNavLayout>
</template>
<style lang="scss" scoped>
.chat-provider-header {
  flex-shrink: 0;
  flex-direction: column;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.chat-provider-content {
  flex: 1;
  overflow: hidden;
  .el-tree {
    --el-tree-node-content-height: 3.5rem;
  }
}

.chat-tree-node {
  --chat-tree-icon-size: 2.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  .chat-tree-icon {
    transition: all 0.3s ease-in-out;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--chat-tree-icon-size);
    height: var(--chat-tree-icon-size);
    border-radius: 0.5rem;
    &:hover {
      background-color: rgba(10, 205, 231, 0.2);
    }
  }
  .chat-tree-label {
    font-size: 1.2rem;
    flex: 1;
  }
  .chat-tree-handle {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}
</style>
