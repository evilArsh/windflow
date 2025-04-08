import { UseEventBusReturn } from "@vueuse/core"
import { VNode } from "vue"
export type CodePluginOptions = {
  /**
   * @description 原始md内容id
   */
  mdId: string
  /**
   * @description 代码块在md内容中的索引
   */
  // idx: number
  /**
   * @description 代码块在dom中的id
   */
  elId: string
  /**
   * @description 代码块的vnode
   */
  vnode: VNode
  /**
   * @description 原始代码
   */
  code?: string
  /**
   * @description 代码语言
   */
  lang?: string
}
export type ProvideMsg = { code: string; lang: string }
export type CodePluginProvideKey = UseEventBusReturn<ProvideMsg, any>
