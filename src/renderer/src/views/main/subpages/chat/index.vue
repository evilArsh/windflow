<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import { ChatTopicTree } from "@renderer/types"
import Message from "./components/message/index.vue"
import useChatStore from "@renderer/store/chat.store"
import { storeToRefs } from "pinia"
import EditTopic from "./components/editTopic/index.vue"
import { type ScaleInstance } from "@renderer/components/ScalePanel/types"
import MenuHandle from "./components/menuHandle/index.vue"
import useMenu from "@renderer/views/main/usable/useMenu"
const { t } = useI18n()
const chatStore = useChatStore()
const { topicList } = storeToRefs(chatStore)
const scaleRef = useTemplateRef<ScaleInstance>("scale")
const scrollRef = useTemplateRef("scroll")
const treeRef = useTemplateRef("treeRef")
const menuRef = useTemplateRef<{ bounding: () => DOMRect | undefined }>("menuRef")
const editTopicRef = useTemplateRef<{ bounding: () => DOMRect | undefined }>("editTopicRef")
const { menu, dlg, panelConfig, tree, selectedTopic, currentNodeKey, createNewTopic } = useMenu(
  scaleRef,
  scrollRef,
  editTopicRef,
  menuRef,
  treeRef
)
onMounted(() => {
  window.addEventListener("resize", dlg.clickMask)
})
onBeforeUnmount(() => {
  window.removeEventListener("resize", dlg.clickMask)
})
</script>
<template>
  <SubNavLayout id="chat.subNav">
    <template #submenu>
      <div class="chat-provider-header">
        <el-input v-model="tree.searchKeyword" :placeholder="t('chat.search')" clearable />
        <Button @click="done => createNewTopic(done)">
          <i class="text-1.4rem i-ep:plus"></i>
          <el-text>{{ t("chat.addChat") }}</el-text>
        </Button>
      </div>
      <div class="chat-provider-content">
        <el-scrollbar ref="scroll">
          <el-tree
            ref="treeRef"
            :filter-node-method="tree.filterNode"
            :default-expanded-keys="tree.defaultExpandedKeys"
            :current-node-key="currentNodeKey"
            :expand-on-click-node="false"
            :indent="18"
            highlight-current
            :data="topicList"
            node-key="id"
            :props="tree.props"
            @node-click="tree.onNodeClick"
            @node-expand="tree.onNodeExpand"
            @node-collapse="tree.onNodeCollapse">
            <template #default="{ data }: { data: ChatTopicTree }">
              <div class="chat-tree-node" @mouseenter="tree.onMouseEnter(data)" @mouseleave="tree.onMouseLeave">
                <el-button text size="small" @click.stop="menu.openQuickEdit($event, data)" circle>
                  <div class="chat-tree-icon">
                    <Svg :src="data.node.icon" class="text-18px"></Svg>
                  </div>
                </el-button>
                <div class="flex-1 flex items-center overflow-hidden gap-0.25rem">
                  <i-eos-icons:bubble-loading
                    v-show="data.node.requestCount > 0"
                    class="text-1.2rem"></i-eos-icons:bubble-loading>
                  <el-text class="chat-tree-label" line-clamp="2">{{ data.node.label }}</el-text>
                </div>
                <div v-show="tree.currentHover === data.id" class="chat-tree-handle">
                  <el-button @click.stop="menu.open($event, data)" circle size="small">
                    <i-ep:more-filled></i-ep:more-filled>
                  </el-button>
                </div>
              </div>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>
      <ScalePanel v-model="panelConfig" ref="scale" @mask-click="dlg.clickMask">
        <MenuHandle
          v-if="dlg.is === 'menu'"
          ref="menuRef"
          :focus="!!panelConfig.mask"
          @edit="menu.onEdit"
          @delete="menu.onDelete"
          @add="menu.onAdd"></MenuHandle>
        <EditTopic
          ref="editTopicRef"
          v-else-if="dlg.is === 'editTopic' && selectedTopic"
          v-model="selectedTopic.node"
          @close="dlg.clickMask"></EditTopic>
      </ScalePanel>
    </template>
    <template #content>
      <Message />
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
  gap: 0.5rem;
  flex: 1;
  overflow: hidden;
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
    font-size: 14px;
  }
  .chat-tree-handle {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}
</style>
