import { UseEventBusReturn } from "@vueuse/core"
import { VNode } from "vue"
export type CodePluginOptions = {
  mdId: string
  idx: number
  elId: string
  vnode: VNode
  code?: string
  lang?: string
}
export type ProvideMsg = { code: string; lang: string }
export type CodePluginProvideKey = UseEventBusReturn<ProvideMsg, any>
