<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import { ChatTopicTree } from "@renderer/types"
import ChatContent from "./components/chatContent/index.vue"
import useChatStore from "@renderer/store/chat.store"
import { storeToRefs } from "pinia"
import EditTopic from "./components/editTopic/index.vue"
import { type ScaleInstance } from "@renderer/components/ScalePanel/types"
import MenuHandle from "./components/menuHandle/index.vue"
import useMenu from "./usable/useMenu"
import useSettingsStore from "@renderer/store/settings.store"
import { WatchHandle } from "vue"
const { t } = useI18n()
const settingsStore = useSettingsStore()
const keyword = ref<string>("") // 搜索关键字
const chatStore = useChatStore()
const { topicList } = storeToRefs(chatStore)
const scaleRef = useTemplateRef<ScaleInstance>("scale")
const scrollRef = useTemplateRef("scroll")
const treeRef = useTemplateRef("treeRef")
const menuRef = useTemplateRef<{ bounding: () => DOMRect | undefined }>("menuRef")
const editTopicRef = useTemplateRef<{ bounding: () => DOMRect | undefined }>("editTopicRef")
const subNavWidth = ref<string>("")
const widthWacher = shallowRef<WatchHandle>()
const { dlg, tree, currentTopic, selectedTopic } = useMenu(scaleRef, scrollRef, editTopicRef, menuRef, treeRef)

onMounted(() => {
  window.addEventListener("resize", dlg.clickMask)
  widthWacher.value = settingsStore.dataWatcher<string | number>("chat.subNavWidth", subNavWidth, "300px")
})
onBeforeUnmount(() => {
  window.removeEventListener("resize", dlg.clickMask)
  widthWacher.value?.stop()
})
</script>
<template>
  <SubNavLayout v-model:width="subNavWidth">
    <template #submenu>
      <div class="chat-provider-header">
        <el-input v-model="keyword" :placeholder="t('chat.search')" />
        <Button @click="done => dlg.newTopic(done)">
          <i class="text-1.4rem i-ep:plus"></i>
          <el-text>{{ t("chat.addChat") }}</el-text>
        </Button>
      </div>
      <div class="chat-provider-content">
        <el-scrollbar ref="scroll">
          <el-tree
            ref="treeRef"
            :default-expanded-keys="tree.defaultExpandedKeys"
            :current-node-key="currentTopic?.id"
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
                <div class="chat-tree-icon" @click.stop="dlg.openQuickEdit($event, data)">
                  <Svg :src="data.node.icon" class="text-18px"></Svg>
                </div>
                <div class="flex items-center flex-1">
                  <el-text class="chat-tree-label" line-clamp="2">{{ data.node.label }}</el-text>
                </div>
                <div v-show="tree.currentHover === data.id" class="chat-tree-handle">
                  <el-button @click.stop="dlg.openMenu($event, data)" circle size="small">
                    <i-ep:more-filled></i-ep:more-filled>
                  </el-button>
                </div>
              </div>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>
      <ScalePanel v-model="dlg.data" ref="scale" @mask-click="dlg.clickMask">
        <MenuHandle
          v-if="dlg.is === 'menu'"
          ref="menuRef"
          :focus="!!dlg.data.mask"
          @edit="dlg.onMenuEdit"
          @delete="dlg.onMenuDelete"
          @add="dlg.onMenuAdd"></MenuHandle>
        <EditTopic
          ref="editTopicRef"
          v-else-if="dlg.is === 'editTopic' && selectedTopic"
          v-model="selectedTopic.node"
          @close="dlg.clickMask"></EditTopic>
      </ScalePanel>
    </template>
    <template #content v-if="currentTopic">
      <ChatContent v-model="currentTopic.node" />
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
