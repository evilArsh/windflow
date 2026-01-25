import { ChatMessage, SettingKeys } from "@windflow/core/types"
import { useTree } from "./hooks/useTree"
import { useDlg } from "./hooks/useDlg"
import { useMenu } from "./hooks/useMenu"
import useSettingsStore from "@renderer/store/settings"
import { type ScrollbarInstance } from "element-plus"
import type { TreeInstance } from "element-plus"
import { useShortcut, z, CallBackFn, useDialog, cloneDeep } from "@toolmain/shared"
import { useEventBus } from "@vueuse/core"
import PQueue from "p-queue"
import { ScaleConfig, ScaleInstance } from "@toolmain/components"
import { useTask } from "@renderer/hooks/useTask"
import { createChatMessage } from "@windflow/core/message"

const useMenuToggle = () => {
  const toggleBus = useEventBus<boolean>("toggle")
  const settingsStore = useSettingsStore()
  // toggle show left menu
  const { data: showTreeMenu } = settingsStore.dataWatcher<boolean>(SettingKeys.ChatToggleMenu, null, true)
  // toggle show right menu
  const { data: showRightPanel } = settingsStore.dataWatcher<boolean>(SettingKeys.ChatTogglePanel, null, false)
  const shortcut = useShortcut()
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
    shortcut.listen("ctrl+b", res => {
      res && toggleTreeMenu()
    })
    shortcut.listen("ctrl+shift+b", res => {
      res && toggleRightPanel()
    })
  }
  onBeforeUnmount(() => {
    toggleBus.reset()
  })
  onBeforeMount(init)
  return {
    showTreeMenu,
    showRightPanel,
    toggleTreeMenu,
    toggleRightPanel,
    watchToggle,
    unWatchToggle,
    init,
    emitToggle: (toggle?: boolean) => {
      toggleBus.emit(toggle)
    },
  }
}
export const useMessageEdit = () => {
  const cachedMessage = ref<ChatMessage>(createChatMessage({ id: "" }))
  const callback = shallowRef<CallBackFn>()
  const messageDialog = useDialog({
    width: "70vw",
    showClose: false,
  })
  function updateMessages(messages: ChatMessage) {
    cachedMessage.value = cloneDeep(messages)
  }
  async function wait(): Promise<ChatMessage | undefined> {
    return new Promise<ChatMessage | undefined>(resolve => {
      callback.value = (message: ChatMessage | undefined) => {
        resolve(message)
      }
    })
  }
  return {
    cachedMessage,
    updateMessages,
    wait,
    ...messageDialog,
    onCancel: () => {
      messageDialog.close()
      callback.value?.()
    },
    onConfirm: () => {
      messageDialog.close()
      callback.value?.(cachedMessage.value.id ? cachedMessage.value : undefined)
    },
  }
}
export const useMsgContext = () => {
  const menuToggle = useMenuToggle()
  const messageDialog = useMessageEdit()
  return {
    menuToggle,
    messageDialog,
  }
}
export const useMenuContext = (
  scaleRef: Readonly<Ref<ScaleInstance | null>>,
  scrollRef: Readonly<Ref<ScrollbarInstance | null>>,
  editTopicRef: Readonly<Ref<{ bounding: () => DOMRect | undefined } | null>>,
  menuRef: Readonly<Ref<{ bounding: () => DOMRect | undefined } | null>>,
  treeRef: Readonly<Ref<TreeInstance | null>>
) => {
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
  const task = useTask(new PQueue({ concurrency: 1 }))
  const tree = useTree(treeRef, scrollRef, task, panelConfig)
  const dlg = useDlg(scaleRef, tree, panelConfig)
  const menu = useMenu(editTopicRef, menuRef, treeRef, dlg, task, tree, panelConfig)
  const { selectedTopic, currentTopic, currentNodeKey, defaultExpandedKeys, searchKeyword, treeProps, currentHover } =
    tree
  const { is } = dlg

  return {
    dlg,
    menu,
    tree,
    is,
    panelConfig,
    treeProps,
    currentNodeKey,
    currentTopic,
    selectedTopic,
    searchKeyword,
    defaultExpandedKeys,
    currentHover,
  }
}
