import { SettingKeys } from "@renderer/types"
import { useTree } from "./hooks/useTree"
import { useDlg } from "./hooks/useDlg"
import { useMenu } from "./hooks/useMenu"
import useSettingsStore from "@renderer/store/settings"
import { type ScrollbarInstance } from "element-plus"
import type { TreeInstance } from "element-plus"
import { useShortcut, z, CallBackFn } from "@toolmain/shared"
import { useEventBus } from "@vueuse/core"
import PQueue from "p-queue"
import { ScaleConfig, ScaleInstance } from "@toolmain/components"
import { useTask } from "@renderer/hooks/useTask"

export const useMsgContext = () => {
  const settingsStore = useSettingsStore()
  const shortcut = useShortcut()
  const toggleBus = useEventBus<boolean>("toggle")
  const showTreeMenu = ref(true) // 左侧菜单是否显示
  const showRightPanel = ref(false) // 右侧菜单是否展示
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
    settingsStore.dataWatcher<boolean>(SettingKeys.ChatToggleMenu, showTreeMenu, true)
    settingsStore.dataWatcher<boolean>(SettingKeys.ChatTogglePanel, showRightPanel, true)

    shortcut.listen("ctrl+b", res => {
      res && toggleTreeMenu()
    })
    shortcut.listen("ctrl+shift+b", res => {
      res && toggleRightPanel()
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
