<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import { ChatTopicTree, SettingKeys } from "@renderer/types"
import MessagePanel from "./components/message/index.vue"
import useChatStore from "@renderer/store/chat"
import { storeToRefs } from "pinia"
import useShortcut from "@renderer/views/main/usable/useShortcut"
import EditTopic from "./components/editTopic/index.vue"
import { type ScaleInstance } from "@renderer/components/ScalePanel/types"
import MenuHandle from "./components/menuHandle/index.vue"
import useMenu from "./index"
import ContentBox from "@renderer/components/ContentBox/index.vue"
import useSettingsStore from "@renderer/store/settings"
import { errorToText } from "@shared/error"
// import { ElLoading } from "element-plus"
const settingsStore = useSettingsStore()
const { t } = useI18n()
const shortcut = useShortcut()
const chatStore = useChatStore()
const { topicList } = storeToRefs(chatStore)
const scaleRef = useTemplateRef<ScaleInstance>("scale")
const scrollRef = useTemplateRef("scroll")
const treeRef = useTemplateRef("treeRef")
const menuRef = useTemplateRef<{ bounding: () => DOMRect | undefined }>("menuRef")
const editTopicRef = useTemplateRef<{ bounding: () => DOMRect | undefined }>("editTopicRef")
const { menu, dlg, panelConfig, tree, selectedTopic, currentNodeKey, setCurrentTopic, currentTopic, createNewTopic } =
  useMenu(scaleRef, scrollRef, editTopicRef, menuRef, treeRef)
const toggleMenu = ref(true) // 左侧菜单是否显示
shortcut.listen("ctrl+b", res => {
  if (res.active) {
    toggleMenu.value = !toggleMenu.value
  }
})
settingsStore.api.dataWatcher<boolean>(SettingKeys.ChatToggleMenu, toggleMenu, true)
async function init() {
  await nextTick()
  // const loading = ElLoading.service({
  //   lock: true,
  //   text: "Loading",
  //   background: "rgba(0, 0, 0, 0.7)",
  // })
  try {
    if (currentNodeKey.value) {
      const topicTree = treeRef.value?.getCurrentNode()
      if (topicTree) {
        await setCurrentTopic(topicTree as ChatTopicTree)
      }
    }
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  } finally {
    // loading.close()
  }
}
onMounted(() => {
  window.defaultTopicTitle = t("chat.addChat")
  window.addEventListener("resize", dlg.clickMask)
  init()
})
onBeforeUnmount(() => {
  window.removeEventListener("resize", dlg.clickMask)
})
</script>
<template>
  <SubNavLayout :id="SettingKeys.ChatSubNav" :hide-submenu="!toggleMenu">
    <template #submenu>
      <div class="flex flex-col gap.5rem overflow-hidden">
        <div class="chat-provider-header">
          <div class="flex items-center gap-0.5rem">
            <el-input v-model="tree.searchKeyword" :placeholder="t('chat.search')" clearable />
            <div id="toggleMenu"></div>
          </div>
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
              draggable
              :props="tree.props"
              @node-drop="tree.onNodeDrop"
              @node-click="tree.onNodeClick"
              @node-expand="tree.onNodeExpand"
              @node-collapse="tree.onNodeCollapse">
              <template #default="{ data }: { data: ChatTopicTree }">
                <div class="chat-tree-node" @mouseenter="tree.onMouseEnter(data)" @mouseleave="tree.onMouseLeave">
                  <ContentBox class="m-2px! p1px! flex-1" @icon-click="menu.openQuickEdit($event, data)">
                    <template #icon>
                      <Svg class="max-w4rem h2rem" :src="data.node.icon"></Svg>
                    </template>
                    <div class="flex-1 flex items-center overflow-hidden gap-0.25rem">
                      <i-eos-icons:bubble-loading
                        v-show="data.node.requestCount > 0"
                        class="flex-shrink-0 text-1.2rem"></i-eos-icons:bubble-loading>
                      <el-text line-clamp="1">{{ data.node.label }}</el-text>
                    </div>
                  </ContentBox>
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
          :topic="selectedTopic.node"></EditTopic>
      </ScalePanel>
    </template>
    <template #content>
      <MessagePanel :topic="currentTopic">
        <template #leftHandler>
          <teleport to="#toggleMenu" defer :disabled="!toggleMenu">
            <ContentBox @click="toggleMenu = !toggleMenu" background>
              <i-material-symbols:right-panel-close-outline
                v-if="!toggleMenu"></i-material-symbols:right-panel-close-outline>
              <i-material-symbols:left-panel-close-outline v-else></i-material-symbols:left-panel-close-outline>
            </ContentBox>
          </teleport>
        </template>
      </MessagePanel>
    </template>
  </SubNavLayout>
</template>
<style lang="scss">
.el-tree-node.is-drop-inner {
  .chat-tree-node {
    border-color: var(--el-color-primary);
  }
}
</style>
<style lang="scss" scoped>
.chat-provider-header {
  flex-shrink: 0;
  flex-direction: column;
  display: flex;
  gap: 0.5rem;
}
.chat-provider-content {
  flex: 1;
  overflow: hidden;
  .el-tree {
    --el-tree-node-content-height: auto;
  }
}
.chat-tree-node {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  padding-right: 1rem;
  overflow: hidden;
  border: dashed 1px transparent;
}
.chat-tree-handle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
