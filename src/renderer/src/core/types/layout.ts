import { VNode } from "vue"

export interface NavMenuBase {
  /**
   * @description 唯一标识
   */
  index: string
  /**
   * @description 菜单名称
   */
  label: string
  /**
   * @description 菜单图标
   */
  icon: VNode
  disabled?: boolean
  children?: NavMenuBase[]
}
export type NavPage = NavMenuBase
