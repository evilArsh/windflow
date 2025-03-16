import type { VNode } from "vue"

export interface NavMenuBase {
  index: string
  label: string
  icon: VNode
  disabled?: boolean
  children?: NavMenuBase[]
}

export type NavPage = NavMenuBase
