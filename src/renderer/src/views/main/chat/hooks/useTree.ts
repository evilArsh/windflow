import type Node from "element-plus/es/components/tree/src/model/node"
import { useTask } from "@renderer/hooks/useTask"
import { ChatTopicTree, ChatTopic, SettingKeys } from "@windflow/core/types"
import { ScaleConfig } from "@toolmain/components"
import { errorToText, isArray, msg } from "@toolmain/shared"
import { TreeInstance, ScrollbarInstance, ElMessage, NodeDropType, TreeNodeData } from "element-plus"
import { storeToRefs } from "pinia"
import { Reactive } from "vue"
import useChatStore from "@renderer/store/chat"
import useSettingsStore from "@renderer/store/settings"
import { useThrottleFn } from "@vueuse/core"
import { cloneTopic, createChatTopic } from "@windflow/core/message"
import { findMaxTopicIndex } from "@renderer/store/chat/utils"
export const useTree = (
  treeRef: Readonly<Ref<TreeInstance | null>>,
  scrollRef: Readonly<Ref<ScrollbarInstance | null>>,
  task: ReturnType<typeof useTask>,
  panelConfig: Reactive<ScaleConfig>
) => {
  const { t } = useI18n()
  const settingsStore = useSettingsStore()
  const chatStore = useChatStore()
  const { topicList } = storeToRefs(chatStore)
  const selectedTopic = ref<ChatTopicTree>() // 点击菜单时的节点
  const currentNodeKey = ref("")
  const currentTopic = ref<ChatTopicTree>()
  const defaultExpandedKeys = ref<string[]>([])
  const searchKeyword = ref("")
  const treeProps = reactive({
    label: "label",
    children: "children",
    isLeaf: "isLeaf",
  })
  const currentHover = ref("") // 鼠标移动过的节点
  // 新增聊天
  async function createNew(parentId?: string) {
    try {
      if (task.pending()) {
        ElMessage.warning(t("chat.topicSwitching"))
        return
      }
      let topic: ChatTopic
      if (parentId && selectedTopic.value) {
        pushDefaultExpandedKeys(parentId)
        topic = cloneTopic(selectedTopic.value.node, {
          parentId,
          label: t("chat.addChat"),
          index: findMaxTopicIndex(selectedTopic.value.children),
        })
      } else {
        topic = createChatTopic({
          index: findMaxTopicIndex(topicList.value),
          parentId,
          modelIds: [],
          label: t("chat.addChat"),
          prompt: t("chat.defaultPrompt"),
        })
      }
      const newNode = await chatStore.addChatTopic(topic)
      if (parentId) {
        treeRef.value?.append(newNode, parentId)
      } else {
        chatStore.cachePushChatTopicTree(newNode)
        setTimeout(() => scrollRef.value?.scrollTo(0, scrollRef.value.wrapRef?.clientHeight), 0)
      }
      currentNodeKey.value = newNode.id
    } catch (error) {
      ElMessage.error(errorToText(error))
    }
  }
  // 节点点击
  function onNodeClick(data: ChatTopicTree) {
    if (task.pending()) {
      ElMessage.warning(t("chat.topicSwitching"))
      return
    }
    currentNodeKey.value = data.id
  }
  function onMouseEnter(data: ChatTopicTree) {
    currentHover.value = data.id
  }
  function onMouseLeave() {
    if (!panelConfig.mask) {
      clearCurrentHover()
    }
  }
  function onNodeExpand(node: ChatTopicTree) {
    pushDefaultExpandedKeys(node.id)
  }
  function onNodeCollapse(node: ChatTopicTree) {
    removeDefaultExpandedKeys(node.id)
  }
  function onNodeDrop(draggingNode: Node, dropNode: Node, dropType: NodeDropType) {
    if (dropType === "before" || dropType === "after") {
      draggingNode.data.node.parentId = dropNode.data.node.parentId
      draggingNode.data.node.index = dropType === "before" ? dropNode.data.node.index : dropNode.data.node.index + 1
      const siblings: ChatTopicTree[] = dropNode.parent
        ? isArray(dropNode.parent.data)
          ? dropNode.parent.data
          : dropNode.parent.data.children
        : topicList.value
      const currentIndex = siblings.findIndex(item => item.id === dropNode.data.node.id)
      siblings
        .slice(dropType === "before" ? currentIndex : currentIndex + 1)
        .reduce<number>((prev: number, item: ChatTopicTree) => {
          if (item.node.index <= prev) {
            item.node.index += 1
            chatStore.updateChatTopic(item.node)
          }
          return item.node.index
        }, draggingNode.data.node.index)
      chatStore.updateChatTopic(draggingNode.data.node)
    } else if (dropType === "inner") {
      draggingNode.data.node.parentId = dropNode.data.node.id
      draggingNode.data.node.index = dropNode.data.children.length
      chatStore.updateChatTopic(draggingNode.data.node)
    }
  }
  const onSearchKeywordChange = useThrottleFn(
    (s: string) => {
      searchKeyword.value = s
      treeRef.value?.filter(s)
    },
    250,
    true
  )
  function filterNode(value: string, data: TreeNodeData): boolean {
    return data.node.label.includes(value)
  }
  function pushDefaultExpandedKeys(id: string) {
    if (!defaultExpandedKeys.value.includes(id)) {
      defaultExpandedKeys.value.push(id)
    }
  }
  function removeDefaultExpandedKeys(id: string) {
    const index = defaultExpandedKeys.value.findIndex(item => item === id)
    if (index !== -1) {
      defaultExpandedKeys.value.splice(index, 1)
    }
  }
  async function setCurrentTopic(topic: ChatTopicTree) {
    try {
      if (currentTopic.value && topic.id === currentTopic.value.id) return
      await chatStore.loadChatTopicData(topic.node)
      currentTopic.value = topic
      chatStore.refreshChatTopicModelIds(topic.node)
    } catch (error) {
      console.log("[setCurrentTopic] error", error)
      msg({ code: 500, msg: errorToText(error) })
    }
  }
  function setSelectedTopic(topicTree: ChatTopicTree) {
    selectedTopic.value = topicTree
  }
  function clearCurrentTopic() {
    currentTopic.value = undefined
  }
  function clearCurrentHover() {
    currentHover.value = ""
  }
  settingsStore.dataWatcher<string[]>(SettingKeys.ChatDefaultExpandedKeys, defaultExpandedKeys, [])
  settingsStore.dataWatcher<string>(SettingKeys.ChatCurrentNodeKey, currentNodeKey, "", key => {
    if (!key) {
      return
    }
    nextTick(() => {
      const topicTree = treeRef.value?.getCurrentNode()
      if (topicTree) {
        task.getQueue().add(async () => setCurrentTopic(topicTree as ChatTopicTree))
        chatStore.refreshChatTopicModelIds(topicTree.node)
      }
    })
  })
  return {
    selectedTopic,
    currentTopic,
    currentNodeKey,
    defaultExpandedKeys,
    searchKeyword,
    treeProps,
    currentHover,
    onNodeClick,
    onMouseEnter,
    onMouseLeave,
    onNodeExpand,
    onNodeCollapse,
    onNodeDrop,
    onSearchKeywordChange,
    filterNode,
    pushDefaultExpandedKeys,
    removeDefaultExpandedKeys,
    createNewTopic: createNew,
    setCurrentTopic,
    setSelectedTopic,
    clearCurrentTopic,
    clearCurrentHover,
  }
}
