import { ScaleConfig, type ScaleInstance } from "@renderer/components/ScalePanel/types"
import type { NodeDropType } from "element-plus/es/components/tree/src/tree.type"
import useShortcut from "@renderer/views/main/usable/useShortcut"
import type Node from "element-plus/es/components/tree/src/model/node"
import { ChatTopic, ChatTopicTree, SettingKeys } from "@renderer/types"
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/store/chat"
import { ElMessage, type ScrollbarInstance } from "element-plus"
import type { TreeInstance, TreeNodeData } from "element-plus"
import useSettingsStore from "@renderer/store/settings"
import { errorToText } from "@shared/error"
import { useEventBus, useThrottleFn } from "@vueuse/core"
import { CallBackFn } from "@renderer/lib/shared/types"
import PQueue from "p-queue"

export const useMsgContext = () => {
  const settingsStore = useSettingsStore()
  const shortcut = useShortcut()
  const toggleBus = useEventBus<boolean>("toggle")

  const showTreeMenu = ref(true) // 左侧菜单是否显示
  const showRightPanel = ref(true) // 右侧菜单是否展示

  function toggleTreeMenu(toggle?: boolean) {
    showTreeMenu.value = toggle ?? !showTreeMenu.value
    toggleBus.emit(showTreeMenu.value)
  }
  function toggleRightPanel(toggle?: boolean) {
    showRightPanel.value = toggle ?? !showRightPanel.value
    toggleBus.emit(showRightPanel.value)
  }

  function watchToggle(callback: CallBackFn) {
    toggleBus.on(callback)
  }
  function unWatchToggle(callback: CallBackFn) {
    toggleBus.off(callback)
  }

  function init() {
    settingsStore.api.dataWatcher<boolean>(SettingKeys.ChatToggleMenu, showTreeMenu, true)
    settingsStore.api.dataWatcher<boolean>(SettingKeys.ChatTogglePanel, showRightPanel, true)

    shortcut.listen("ctrl+b", res => {
      if (res.active) toggleTreeMenu()
    })
    shortcut.listen("ctrl+shift+b", res => {
      if (res.active) toggleRightPanel()
    })
  }
  init()
  onBeforeUnmount(() => {
    toggleBus.reset()
  })
  return {
    showTreeMenu,
    showRightPanel,

    toggleTreeMenu,
    toggleRightPanel,
    watchToggle,
    emitToggle: (toggle?: boolean) => {
      toggleBus.emit(toggle)
    },
    unWatchToggle,
  }
}
export const useMenu = (
  scaleRef: Readonly<Ref<ScaleInstance | null>>,
  scrollRef: Readonly<Ref<ScrollbarInstance | null>>,
  editTopicRef: Readonly<Ref<{ bounding: () => DOMRect | undefined } | null>>,
  menuRef: Readonly<Ref<{ bounding: () => DOMRect | undefined } | null>>,
  treeRef: Readonly<Ref<TreeInstance | null>>
) => {
  const chatStore = useChatStore()
  const { t } = useI18n()
  const settingsStore = useSettingsStore()
  const { topicList, chatMessage, currentNodeKey } = storeToRefs(chatStore)
  const selectedTopic = ref<ChatTopicTree>() // 点击菜单时的节点
  const currentTopic = ref<ChatTopicTree>()
  const queue = markRaw(new PQueue({ concurrency: 1 }))

  // 弹框配置
  const panelConfig = reactive<ScaleConfig>({
    containerStyle: {
      zIndex: z.FIXED,
      position: "fixed",
      width: 100,
      left: 0,
      top: 0,
      maxHeight: "100vh",
      overflow: "auto",
      boxShadow: "var(--el-box-shadow-light)",
    },
    mask: false,
    maskStyle: {
      backgroundColor: "transparent",
      zIndex: z.FIXED - 1,
    },
  })
  const dlg = reactive({
    is: "" as "menu" | "editTopic",
    move: markRaw(
      async (x: number, y: number, target: Readonly<Ref<{ bounding: () => DOMRect | undefined } | null>>) => {
        await scaleRef.value?.show(false, "self")
        const rect = target.value?.bounding()
        let fy = y + toNumber(rect?.height) > window.innerHeight ? window.innerHeight - toNumber(rect?.height) : y
        fy = fy < 0 ? 0 : fy
        scaleRef.value?.moveTo(false, { x, y: fy })
      }
    ),
    // 点击菜单遮罩层
    clickMask: markRaw(async () => {
      panelConfig.mask = false
      await scaleRef.value?.hideTo("self", false)
      tree.currentHover = ""
    }),
  })
  async function setCurrentTopic(topic: ChatTopicTree) {
    try {
      if (currentTopic.value && topic.id === currentTopic.value.id) return
      await chatStore.loadChatTopicData(topic.node)
      currentTopic.value = topic
      currentNodeKey.value = topic.id
      chatStore.refreshChatTopicModelIds(topic.node)
    } catch (error) {
      console.log("[setCurrentTopic] error", error)
      msg({ code: 500, msg: errorToText(error) })
    }
  }
  const menu = {
    // 菜单编辑按钮
    onEdit: (event: MouseEvent) => {
      if (selectedTopic.value) {
        dlg.is = "editTopic"
        panelConfig.containerStyle!.width = "600px"
        dlg.move(event.clientX, event.clientY, editTopicRef)
      }
    },
    // 菜单删除按钮
    onDelete: async (done: CallBackFn) => {
      try {
        if (selectedTopic.value) {
          const nodes = chatStore.utils.getAllNodes(selectedTopic.value)
          for await (const item of nodes) {
            if (window.api) {
              await window.api.mcp.stopTopicServers(item.id)
            }
            // 删除展开的节点key
            tree.removeDefaultExpandedKeys(item.id)
            // 终止请求
            chatStore.terminateAll(item)
            // 删除消息缓存
            delete chatMessage.value[item.id]
          }
          treeRef.value?.remove(selectedTopic.value)
          await chatStore.api.delChatTopic(nodes)
          if (selectedTopic.value === currentTopic.value) {
            currentTopic.value = undefined
          }
        }
        dlg.clickMask()
        done()
      } catch (error) {
        ElMessage.error(errorToText(error))
        dlg.clickMask()
        done()
      }
    },
    // 新增子聊天
    onAdd: async (done: CallBackFn) => {
      try {
        if (selectedTopic.value) {
          await createNewTopic(selectedTopic.value.id)
        }
        dlg.clickMask()
        done()
      } catch (error) {
        dlg.clickMask()
        ElMessage.error(errorToText(error))
        done()
      }
    },
    // 点击icon快速编辑
    openQuickEdit: (event: MouseEvent, data: ChatTopicTree) => {
      event.stopPropagation()
      selectedTopic.value = data
      panelConfig.mask = true
      menu.onEdit(event) // 弹出编辑框
    },
    // 打开菜单
    open: (event: MouseEvent, data: ChatTopicTree) => {
      dlg.is = "menu"
      panelConfig.containerStyle!.width = "100px"
      selectedTopic.value = data
      panelConfig.mask = true
      dlg.move(event.clientX, event.clientY, menuRef) // 弹出菜单框
    },
  }
  // 新增聊天
  async function createNewTopic(parentId?: string) {
    try {
      if (queue.pending || queue.size) {
        ElMessage.warning(t("chat.topicSwitching"))
        return
      }
      let topic: ChatTopic
      if (parentId && selectedTopic.value) {
        tree.pushDefaultExpandedKeys(parentId)
        topic = chatStore.utils.cloneTopic(selectedTopic.value.node, {
          parentId,
          label: t("chat.addChat"),
          index: selectedTopic.value.children.length,
        })
      } else {
        topic = chatStore.utils.newTopic(topicList.value.length, {
          parentId,
          modelIds: [],
          label: t("chat.addChat"),
          prompt: t("chat.defaultPrompt"),
        })
      }
      await chatStore.api.addChatTopic(topic)
      const newNode: ChatTopicTree = chatStore.utils.topicToTree(topic)
      if (parentId) {
        treeRef.value?.append(newNode, parentId)
      } else {
        topicList.value.push(newNode)
        setTimeout(() => scrollRef.value?.scrollTo(0, scrollRef.value.wrapRef?.clientHeight), 0)
      }
      await queue.add(async () => setCurrentTopic(newNode))
    } catch (error) {
      ElMessage.error(errorToText(error))
    }
  }
  const tree = reactive({
    defaultExpandedKeys: [] as string[],
    searchKeyword: "",
    // 树属性
    props: {
      label: "label",
      children: "children",
      isLeaf: "isLeaf",
    },
    // 节点点击
    onNodeClick: markRaw((data: ChatTopicTree) => {
      if (queue.pending || queue.size) {
        ElMessage.warning(t("chat.topicSwitching"))
        return
      }
      queue.add(async () => setCurrentTopic(data))
    }),
    // 鼠标移动过的节点
    currentHover: "",
    onMouseEnter: markRaw((data: ChatTopicTree) => {
      tree.currentHover = data.id
    }),
    onMouseLeave: markRaw(() => {
      if (!panelConfig.mask) {
        tree.currentHover = ""
      }
    }),
    onNodeExpand: markRaw((node: ChatTopicTree) => tree.pushDefaultExpandedKeys(node.id)),
    onNodeCollapse: markRaw((node: ChatTopicTree) => tree.removeDefaultExpandedKeys(node.id)),
    onNodeDrop: (draggingNode: Node, dropNode: Node, dropType: NodeDropType) => {
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
              chatStore.api.updateChatTopic(item.node)
            }
            return item.node.index
          }, draggingNode.data.node.index)
        chatStore.api.updateChatTopic(draggingNode.data.node)
      } else if (dropType === "inner") {
        draggingNode.data.node.parentId = dropNode.data.node.id
        draggingNode.data.node.index = dropNode.data.children.length
        chatStore.api.updateChatTopic(draggingNode.data.node)
      }
    },
    filterNode: (value: string, data: TreeNodeData): boolean => {
      return data.node.label.includes(value)
    },
    pushDefaultExpandedKeys: markRaw((id: string) => {
      if (!tree.defaultExpandedKeys.includes(id)) {
        tree.defaultExpandedKeys.push(id)
      }
    }),
    removeDefaultExpandedKeys: markRaw((id: string) => {
      const index = tree.defaultExpandedKeys.findIndex(item => item === id)
      if (index !== -1) {
        tree.defaultExpandedKeys.splice(index, 1)
      }
    }),
  })
  watch(
    () => tree.searchKeyword,
    useThrottleFn(v => treeRef.value?.filter(v))
  )
  settingsStore.api.dataWatcher<string[]>(SettingKeys.ChatDefaultExpandedKeys, toRef(tree, "defaultExpandedKeys"), [])
  return {
    menu,
    dlg,
    panelConfig,
    tree,
    currentNodeKey,
    currentTopic,
    selectedTopic,
    createNewTopic,
    setCurrentTopic: (node: ChatTopicTree) => queue.add(async () => setCurrentTopic(node)),
  }
}
