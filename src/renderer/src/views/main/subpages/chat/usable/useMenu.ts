import { ScaleConfig, type ScaleInstance } from "@renderer/components/ScalePanel/types"
import { ChatTopic, ChatTopicTree } from "@renderer/types"
import { storeToRefs } from "pinia"
import useChatStore from "@renderer/store/chat.store"
import { ElMessage, type ScrollbarInstance } from "element-plus"
import type { TreeData, TreeInstance } from "element-plus"
import { cloneDeep } from "lodash-es"
import type Node from "element-plus/es/components/tree/src/model/node.mjs"
function newTopic(parentId: string): ChatTopic {
  return {
    id: uniqueId(),
    label: "新的聊天",
    parentId: parentId,
    icon: "",
    content: "",
    modelIds: [],
    prompt: "you are a helpful assistant",
  }
}

function cloneTopic(topic: ChatTopic): ChatTopic {
  return cloneDeep({
    ...topic,
    children: [],
    id: uniqueId(),
    isLeaf: true,
    label: "新的聊天",
  })
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
          const newTopic = cloneTopic(selectedTopic.value.node)
          newTopic.parentId = selectedTopic.value.id
          const res = await chatStore.dbAddChatTopic(newTopic)
          if (res != 1) {
            throw new Error(t("chat.addFailed"))
          }
          const newNode: ChatTopicTree = {
            id: newTopic.id,
            node: newTopic,
            children: [],
            isLeaf: true,
          }
          currentTopic.value = newNode // 选中聊天
          treeRef.value?.append(newNode, selectedTopic.value)
          treeRef.value?.setCurrentKey(newNode.id)
          done()
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
    openEditTopic: markRaw(async (done: CallBackFn) => {
      try {
        const topic = newTopic("")
        const newNode: ChatTopicTree = {
          id: topic.id,
          node: topic,
          children: [],
        }
        currentTopic.value = newNode
        const res = await chatStore.dbAddChatTopic(topic)
        if (res != 1) {
          throw new Error(t("chat.addFailed"))
        }
        topicList.value.push(newNode)
        setTimeout(() => scrollRef.value?.scrollTo(0, scrollRef.value.wrapRef?.clientHeight), 0)
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
    onLoad: markRaw(async (node: Node, resolve: (data: TreeData) => void, reject: () => void) => {
      const data = await chatStore.dbFindChildChatTopic(Array.isArray(node.data) ? undefined : (node.data.id as string))
      if (data) {
        for (const item of data) {
          const childCount = await chatStore.dbChildCount(item.id)
          item.isLeaf = childCount == 0
        }
        resolve(
          data.map(item => {
            return {
              id: item.id,
              node: item,
              children: [],
              isLeaf: item.isLeaf,
            }
          })
        )
      } else {
        reject()
      }
    }),
    onMouseEnter: markRaw((data: ChatTopicTree) => {
      tree.currentHover = data.id
    }),
    onMouseLeave: markRaw(() => {
      if (!dlg.data.mask) {
        tree.currentHover = ""
      }
    }),
  })
  return {
    dlg,
    tree,
    currentTopic,
    selectedTopic,
  }
}
