import { ScaleConfig, type ScaleInstance } from "@renderer/components/ScalePanel/types"
import { ChatTopic, ChatTopicTree } from "@renderer/types"
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/store/chat.store"
import { ElMessage, type ScrollbarInstance } from "element-plus"
import type { TreeInstance } from "element-plus"
import { cloneDeep } from "lodash-es"
import useSettingsStore from "@renderer/store/settings.store"

function newTopic(parentId: string | null): ChatTopic {
  return {
    id: uniqueId(),
    label: "新的聊天",
    parentId,
    icon: "",
    content: "",
    modelIds: [],
    prompt: "you are a helpful assistant",
    chatMessageId: "",
    createAt: Date.now(),
  }
}
function cloneTopic(topic: ChatTopic, parentId: string | null): ChatTopic {
  return cloneDeep({
    ...topic,
    id: uniqueId(),
    label: "新的聊天",
    parentId,
    chatMessageId: "",
  })
}
function topicToTree(topic: ChatTopic): ChatTopicTree {
  return {
    id: topic.id,
    node: topic,
    children: [],
  }
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
  const settingsStore = useSettingsStore()
  const { topicList } = storeToRefs(chatStore)
  const currentTopic = ref<ChatTopicTree>() // 当前选中的聊天
  const selectedTopic = ref<ChatTopicTree>() // 点击菜单时的节点
  const dlg = reactive({
    data: {
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
    } as ScaleConfig,
    is: "" as "menu" | "editTopic",
    moveDlg: markRaw(
      async (x: number, y: number, target: Readonly<Ref<{ bounding: () => DOMRect | undefined } | null>>) => {
        await scaleRef.value?.show(false, "self")
        const rect = target.value?.bounding()
        let fy = y + toNumber(rect?.height) > window.innerHeight ? window.innerHeight - toNumber(rect?.height) : y
        fy = fy < 0 ? 0 : fy
        scaleRef.value?.moveTo(false, { x, y: fy })
      }
    ),
    // 菜单编辑按钮
    onMenuEdit: markRaw((event: MouseEvent) => {
      if (selectedTopic.value) {
        dlg.is = "editTopic"
        dlg.data.containerStyle!.width = "600px"
        dlg.moveDlg(event.clientX, event.clientY, editTopicRef)
      }
    }),
    // 菜单删除按钮
    onMenuDelete: markRaw(async (done: CallBackFn) => {
      try {
        if (selectedTopic.value) {
          const res = await chatStore.dbDelChatTopic(selectedTopic.value.node)
          // TODO 删除defaultExpandedKeys
          if (res != 1) {
            throw new Error(t("chat.deleteFailed"))
          }
          treeRef.value?.remove(selectedTopic.value)
          selectedTopic.value = undefined
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
    }),
    // 新增子聊天
    onMenuAdd: markRaw(async (done: CallBackFn) => {
      try {
        if (selectedTopic.value) {
          await dlg.newTopic(done, selectedTopic.value.id)
        }
        dlg.clickMask()
        done()
      } catch (error) {
        dlg.clickMask()
        ElMessage.error(errorToText(error))
        done()
      }
    }),
    // 打开菜单
    openMenu: markRaw((event: MouseEvent, data: ChatTopicTree) => {
      dlg.is = "menu"
      dlg.data.containerStyle!.width = "100px"
      selectedTopic.value = data
      dlg.data.mask = true
      dlg.moveDlg(event.clientX, event.clientY, menuRef) // 弹出菜单框
    }),
    // 点击icon快速编辑
    openQuickEdit: markRaw((event: MouseEvent, data: ChatTopicTree) => {
      selectedTopic.value = data
      dlg.data.mask = true
      dlg.onMenuEdit(event) // 弹出编辑框
    }),
    // 新增聊天
    newTopic: markRaw(async (done: CallBackFn, parentId?: string) => {
      try {
        const topic =
          parentId && selectedTopic.value ? cloneTopic(selectedTopic.value.node, parentId) : newTopic(parentId ?? null)
        if (parentId) tree.pushDefaultExpandedKeys(parentId)
        const res = await chatStore.dbAddChatTopic(topic)
        if (res != 1) throw new Error(t("chat.addFailed"))
        const newNode: ChatTopicTree = topicToTree(topic)
        if (parentId) {
          treeRef.value?.append(newNode, parentId)
        } else {
          topicList.value.push(newNode)
          setTimeout(() => scrollRef.value?.scrollTo(0, scrollRef.value.wrapRef?.clientHeight), 0)
        }
        currentTopic.value = newNode
        done()
      } catch (error) {
        ElMessage.error(errorToText(error))
        done()
      }
    }),
    // 点击菜单遮罩层
    clickMask: markRaw(() => {
      dlg.data.mask = false
      scaleRef.value?.hideTo("self", false)
      tree.currentHover = ""
    }),
  })

  const tree = reactive({
    defaultExpandedKeys: [] as string[],
    // 树属性
    props: {
      label: "label",
      children: "children",
      isLeaf: "isLeaf",
    },
    // 节点点击
    onNodeClick: markRaw((data: ChatTopicTree) => {
      currentTopic.value = data
    }),
    // 鼠标移动过的节点
    currentHover: "",
    onMouseEnter: markRaw((data: ChatTopicTree) => {
      tree.currentHover = data.id
    }),
    onMouseLeave: markRaw(() => {
      if (!dlg.data.mask) {
        tree.currentHover = ""
      }
    }),
    onNodeExpand: markRaw((node: ChatTopicTree) => tree.pushDefaultExpandedKeys(node.id)),
    onNodeCollapse: markRaw((node: ChatTopicTree) => tree.removeDefaultExpandedKeys(node.id)),
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
      if (val && val === old) chatStore.dbUpdateChatTopic(val.node)
    },
    { deep: true }
  )
  watch(
    selectedTopic,
    (val, old) => {
      if (val && val === old) chatStore.dbUpdateChatTopic(val.node)
    },
    { deep: true }
  )

  const watcher = settingsStore.dataWatcher<string[]>(
    "chat.defaultExpandedKeys",
    toRef(tree, "defaultExpandedKeys"),
    []
  )

  onBeforeUnmount(() => {
    watcher.stop()
  })
  return {
    dlg,
    tree,
    currentTopic,
    selectedTopic,
  }
}
