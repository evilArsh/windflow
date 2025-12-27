import { ChatTopicTree } from "@windflow/core/types"
import { ScaleConfig } from "@toolmain/components"
import { toNumber, CallBackFn, errorToText } from "@toolmain/shared"
import { TreeInstance, ElMessage } from "element-plus"
import useChatStore from "@renderer/store/chat"
import { Reactive } from "vue"
import { useDlg } from "./useDlg"
import { useTree } from "./useTree"
import { useTask } from "@renderer/hooks/useTask"
import { getAllNodes } from "@renderer/store/chat/utils"

export const useMenu = (
  editTopicRef: Readonly<Ref<{ bounding: () => DOMRect | undefined } | null>>,
  menuRef: Readonly<Ref<{ bounding: () => DOMRect | undefined } | null>>,
  treeRef: Readonly<Ref<TreeInstance | null>>,
  dlg: ReturnType<typeof useDlg>,
  task: ReturnType<typeof useTask>,
  treeCtx: ReturnType<typeof useTree>,
  panelConfig: Reactive<ScaleConfig>
) => {
  const chatStore = useChatStore()
  const { t } = useI18n()
  // 菜单编辑按钮
  function onEdit(event?: MouseEvent) {
    if (treeCtx.selectedTopic.value) {
      dlg.setIs("editTopic")
      panelConfig.containerStyle!.width = "600px"
      dlg.move(toNumber(event?.clientX), toNumber(event?.clientY), editTopicRef)
    }
  }
  // 菜单删除按钮
  async function onDelete(done: CallBackFn) {
    try {
      if (treeCtx.selectedTopic.value) {
        if (task.pending()) {
          ElMessage.warning(t("chat.topicSwitching"))
          return
        }
        const nodes = getAllNodes(treeCtx.selectedTopic.value)
        for (const item of nodes) {
          if (window.api) {
            await window.api.mcp.stopTopicServers(item.id)
          }
          // 删除展开的节点key
          treeCtx.removeDefaultExpandedKeys(item.id)
          // 终止请求
          chatStore.terminateAll(item.id, true)
          // 删除消息缓存
          chatStore.cacheRemoveChatMessage(item.id)
        }
        treeRef.value?.remove(treeCtx.selectedTopic.value)
        await task.getQueue().add(async () => chatStore.removeChatTopic(nodes))
        if (treeCtx.selectedTopic.value.id === treeCtx.currentTopic.value?.id) {
          treeCtx.clearCurrentTopic()
        }
      }
      dlg.clickMask()
      done()
    } catch (error) {
      ElMessage.error(errorToText(error))
      dlg.clickMask()
      done()
    }
  }
  // 新增子聊天
  async function onAdd(done: CallBackFn) {
    try {
      if (treeCtx.selectedTopic.value) {
        await treeCtx.createNewTopic(treeCtx.selectedTopic.value.id)
      }
      dlg.clickMask()
      done()
    } catch (error) {
      dlg.clickMask()
      ElMessage.error(errorToText(error))
      done()
    }
  }
  // 点击icon快速编辑
  function openQuickEdit(event: MouseEvent, data: ChatTopicTree) {
    event.stopPropagation()
    treeCtx.setSelectedTopic(data)
    panelConfig.mask = true
    onEdit(event) // 弹出编辑框
  }
  // 打开菜单
  function open(event: MouseEvent, data: ChatTopicTree) {
    dlg.setIs("menu")
    panelConfig.containerStyle!.width = "100px"
    treeCtx.setSelectedTopic(data)
    panelConfig.mask = true
    dlg.move(event.clientX, event.clientY, menuRef) // 弹出菜单框
  }
  return { onEdit, onDelete, onAdd, openQuickEdit, open }
}
