import { ScaleConfig, type ScaleInstance } from "@renderer/components/ScalePanel/types"
import type { NodeDropType } from "element-plus/es/components/tree/src/tree.type"
import type Node from "element-plus/es/components/tree/src/model/node"
import { ChatMessage, ChatTopicTree, SettingKeys } from "@renderer/types"
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/store/chat"
import { ElMessage, type ScrollbarInstance } from "element-plus"
import type { TreeInstance, TreeNodeData } from "element-plus"
import useSettingsStore from "@renderer/store/settings"
import { errorToText } from "@shared/error"
import { useThrottleFn } from "@vueuse/core"

export default (
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
  // 弹框配置
  const panelConfig = reactive<ScaleConfig>({
    hideFirst: true,
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
      backgroundColor: "rgba(0, 0, 0, 0)",
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
      let message: ChatMessage | undefined
      if (topic.node.chatMessageId) {
        message = chatStore.utils.findChatMessage(topic.node.chatMessageId)
        if (!message) {
          message = await chatStore.api.getChatMessage(topic.node.chatMessageId)
          if (!message) {
            message = await chatStore.api.createNewMessage()
            topic.node.chatMessageId = message.id
          }
          chatMessage.value[message.id] = message
        }
      } else {
        message = await chatStore.api.createNewMessage()
        chatMessage.value[message.id] = message
        topic.node.chatMessageId = message.id
      }
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
          for (const item of nodes) {
            if (window.api) {
              item.mcpServers.forEach(server => {
                window.api.mcp.toggleServer(item.id, server.id, { command: "stop" })
              })
            }
            // 删除展开的节点key
            tree.removeDefaultExpandedKeys(item.id)
            // 终止请求
            chatStore.terminateAll(item)
            // 删除消息缓存
            if (item.chatMessageId) {
              delete chatMessage.value[item.chatMessageId]
            }
          }
          treeRef.value?.remove(selectedTopic.value)
          const res = await chatStore.api.delChatTopic(nodes)
          if (!res) {
            throw new Error(t("chat.deleteFailed"))
          }
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
          await createNewTopic(done, selectedTopic.value.id)
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
  async function createNewTopic(done: CallBackFn, parentId?: string) {
    try {
      const topic =
        parentId && selectedTopic.value
          ? chatStore.utils.cloneTopic(selectedTopic.value.node, parentId, t("chat.addChat"))
          : chatStore.utils.newTopic(parentId ?? null, [], t("chat.addChat"))
      if (parentId) tree.pushDefaultExpandedKeys(parentId)
      await chatStore.api.addChatTopic(topic)
      const newNode: ChatTopicTree = chatStore.utils.topicToTree(topic)
      if (parentId) {
        treeRef.value?.append(newNode, parentId)
      } else {
        topicList.value.push(newNode)
        setTimeout(() => scrollRef.value?.scrollTo(0, scrollRef.value.wrapRef?.clientHeight), 0)
      }
      setCurrentTopic(newNode)
      done()
    } catch (error) {
      ElMessage.error(errorToText(error))
      done()
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
      setCurrentTopic(data)
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
        draggingNode.data.node.createAt =
          dropType === "before" ? dropNode.data.node.createAt - 1 : dropNode.data.node.createAt + 1
      } else if (dropType === "inner") {
        draggingNode.data.node.parentId = dropNode.data.node.id
        draggingNode.data.node.createAt = dropNode.data.node.createAt + 1
      }
      chatStore.api.updateChatTopic(draggingNode.data.node)
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
    setCurrentTopic,
  }
}
