import { ScaleConfig, type ScaleInstance } from "@renderer/components/ScalePanel/types"
import { ChatTopic, ChatTopicTree } from "@renderer/types"
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/store/chat.store"
import { ElMessage, type ScrollbarInstance } from "element-plus"
import type { TreeInstance, TreeNodeData } from "element-plus"
import { cloneDeep } from "lodash-es"
import useSettingsStore from "@renderer/store/settings.store"
import { chatMessageDefault } from "@renderer/store/default/chat.default"
import { getDefaultIcon } from "@renderer/components/SvgPicker"
import { errorToText } from "@shared/error"
function newTopic(parentId: string | null, modelIds: string[], label: string): ChatTopic {
  return {
    id: uniqueId(),
    label,
    parentId,
    icon: getDefaultIcon(),
    content: "",
    modelIds: cloneDeep(modelIds),
    prompt: "you are a helpful assistant",
    chatMessageId: "",
    createAt: Date.now(),
    requestCount: 0,
  }
}
function cloneTopic(topic: ChatTopic, parentId: string | null, label: string): ChatTopic {
  return cloneDeep({
    ...topic,
    id: uniqueId(),
    label,
    parentId,
    chatMessageId: "",
    requestCount: 0,
  })
}
function topicToTree(topic: ChatTopic): ChatTopicTree {
  return {
    id: topic.id,
    node: topic,
    children: [],
  }
}
function getAllNodes(current: ChatTopicTree): ChatTopic[] {
  const res: ChatTopic[] = []
  res.push(current.node)
  current.children.forEach(item => {
    res.push(item.node)
    res.push(...getAllNodes(item))
  })
  return res
}
export default (
  scaleRef: Readonly<Ref<ScaleInstance | null>>,
  scrollRef: Readonly<Ref<ScrollbarInstance | null>>,
  editTopicRef: Readonly<Ref<{ bounding: () => DOMRect | undefined } | null>>,
  menuRef: Readonly<Ref<{ bounding: () => DOMRect | undefined } | null>>,
  treeRef: Readonly<Ref<TreeInstance | null>>
) => {
  const chatStore = useChatStore()
  const { t } = useI18n()
  // const { models } = storeToRefs(modelStore)
  const settingsStore = useSettingsStore()
  const { topicList, chatMessage, currentTopic, currentMessage, currentNodeKey } = storeToRefs(chatStore)
  const selectedTopic = ref<ChatTopicTree>() // 点击菜单时的节点
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
  const newMessage = async () => {
    const msg = chatMessageDefault()
    await chatStore.api.addChatMessage(msg)
    return msg
  }
  const setCurrentTopic = async (topic?: ChatTopicTree) => {
    try {
      if (topic) {
        if (currentTopic.value && topic.id === currentTopic.value.id) return
        if (topic.node.chatMessageId) {
          const cached = chatMessage.value[topic.node.chatMessageId]
          if (cached) {
            currentMessage.value = cached
          } else {
            const data = await chatStore.api.findChatMessage(topic.node.chatMessageId)
            if (data) {
              chatMessage.value[topic.node.chatMessageId] = data
              currentMessage.value = chatMessage.value[topic.node.chatMessageId]
            } else {
              const msg = await newMessage()
              chatMessage.value[msg.id] = msg
              topic.node.chatMessageId = msg.id
              currentMessage.value = chatMessage.value[msg.id]
            }
          }
        } else {
          const msg = await newMessage()
          chatMessage.value[msg.id] = msg
          topic.node.chatMessageId = msg.id
          currentMessage.value = chatMessage.value[msg.id]
        }
        chatStore.mountContext(topic.node, currentMessage.value)
      }
      currentTopic.value = topic
      chatStore.refreshChatTopicModelIds(topic?.node)
    } catch (error) {
      console.log("[setCurrentTopic] error", error)
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
          const nodes = getAllNodes(selectedTopic.value)
          nodes.forEach(item => {
            // 删除展开的节点key
            tree.removeDefaultExpandedKeys(item.id)
            // 终止请求
            chatStore.terminateAll(item.id)
            // 删除消息缓存
            if (item.chatMessageId) {
              delete chatMessage.value[item.chatMessageId]
            }
          })
          treeRef.value?.remove(selectedTopic.value)
          const res = await chatStore.api.delChatTopic(nodes)
          if (!res) {
            throw new Error(t("chat.deleteFailed"))
          }
          // 删除当前打开的消息
          if (currentMessage.value?.id === selectedTopic.value?.node.chatMessageId) {
            currentMessage.value = undefined
          }
          if (selectedTopic.value === currentTopic.value) {
            setCurrentTopic(undefined)
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
          ? cloneTopic(selectedTopic.value.node, parentId, t("chat.addChat"))
          : newTopic(parentId ?? null, [], t("chat.addChat"))
      if (parentId) tree.pushDefaultExpandedKeys(parentId)
      await chatStore.api.addChatTopic(topic)
      const newNode: ChatTopicTree = topicToTree(topic)
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
    currentTopic,
    (val, old) => {
      if (val) {
        if (val === old) {
          chatStore.api.updateChatTopic(val.node)
        } else {
          currentNodeKey.value = val.id
        }
      }
    },
    { deep: true }
  )
  watch(
    selectedTopic,
    async (val, old) => {
      if (val && val === old) {
        await chatStore.api.updateChatTopic(val.node)
      }
    },
    { deep: true }
  )
  watch(
    currentMessage,
    async (val, old) => {
      if (val && val.id && val === old) {
        await chatStore.api.updateChatMessage(val)
      }
    },
    { deep: true }
  )
  watch(
    () => tree.searchKeyword,
    v => {
      treeRef.value?.filter(v)
    }
  )
  const watchKeys = settingsStore.api.dataWatcher<string[]>(
    "chat.defaultExpandedKeys",
    toRef(tree, "defaultExpandedKeys"),
    []
  )
  onBeforeUnmount(() => {
    watchKeys.stop()
  })
  return {
    menu,
    dlg,
    panelConfig,
    tree,
    currentNodeKey,
    selectedTopic,
    createNewTopic,
  }
}
