import { ScaleInstance, ScaleConfig } from "@toolmain/components"
import { toNumber } from "@toolmain/shared"

export default (scaleRef: Readonly<Ref<ScaleInstance | null>>, target: Readonly<Ref<HTMLElement | null>>) => {
  const index = 9999
  // 弹框配置
  const panelConfig = reactive<ScaleConfig>({
    containerStyle: {
      zIndex: index,
      position: "fixed",
      width: 600,
      left: 0,
      top: 0,
      backgroundColor: "var(--el-color-white)",
      maxHeight: "100vh",
      overflow: "auto",
      boxShadow: "var(--el-box-shadow-light)",
    },
    mask: false,
    maskStyle: {
      backgroundColor: "transparent",
      zIndex: index - 1,
    },
  })
  const move = async (x: number, y: number) => {
    await scaleRef.value?.show(false, "self")
    const rect = target.value?.getBoundingClientRect()
    let fy = y + toNumber(rect?.height) > window.innerHeight ? window.innerHeight - toNumber(rect?.height) : y
    fy = fy < 0 ? 0 : fy
    scaleRef.value?.moveTo(false, { x, y: fy })
  }
  const open = async (x: number, y: number) => {
    panelConfig.mask = true
    await move(x, y)
  }
  const clickMask = async () => {
    panelConfig.mask = false
    await scaleRef.value?.hideTo("self", false)
  }
  return {
    panelConfig,
    open,
    clickMask,
  }
}
