import { z } from "@renderer/lib/shared/zindex"
import { ScaleConfig } from "@renderer/components/ScalePanel/types"
import { defaultProps } from "@renderer/components/ScalePanel/helper"

export default () => {
  const config = ref<ScaleConfig>(
    defaultProps({
      name: "配置",
      scalable: true,
      autoStick: false,
      defaultHeader: false,
      defaultToolbar: false,
      hideFirst: false,
      maximized: false,
      minimized: false,
      containerStyle: {
        left: 0,
        top: 0,
        zIndex: z.FIXED_TOP,
        position: "fixed",
        width: 500,
        height: 800,
      },
      contentStyle: {
        overflow: "hidden",
        backgroundColor: "#ffffff",
        borderRadius: 6,
        boxShadow:
          "0px 4px 18px #0000000a,0px 2.025px 7.84688px rgba(0,0,0,.027),0px 0.8px 2.925px #00000005,0px 0.175px 1.04062px rgba(0,0,0,.013)",
      },
    })
  )
  return { config }
}
