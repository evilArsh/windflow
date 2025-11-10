import type { useTree } from "./useTree"
import { ScaleInstance, ScaleConfig } from "@toolmain/components"
import { toNumber } from "@toolmain/shared"
import { Reactive } from "vue"

export const useDlg = (
  scaleRef: Readonly<Ref<ScaleInstance | null>>,
  treeCtx: ReturnType<typeof useTree>,
  panelConfig: Reactive<ScaleConfig>
) => {
  const is = ref<"menu" | "editTopic" | "">("")
  async function move(x: number, y: number, target: Readonly<Ref<{ bounding: () => DOMRect | undefined } | null>>) {
    await scaleRef.value?.show(false, "self")
    const rect = target.value?.bounding()
    let fy = y + toNumber(rect?.height) > window.innerHeight ? window.innerHeight - toNumber(rect?.height) : y
    fy = fy < 0 ? 0 : fy
    scaleRef.value?.moveTo(false, { x, y: fy })
  }
  async function clickMask() {
    panelConfig.mask = false
    await scaleRef.value?.hideTo("self", false)
    treeCtx.clearCurrentHover()
  }
  function setIs(status: "menu" | "editTopic" | "") {
    is.value = status
  }
  return {
    is: readonly(is),
    move,
    setIs,
    clickMask,
  }
}
