export interface NavMenuBase {
  index: string
  label: string
  icon: string
  disabled?: boolean
  children?: NavMenuBase[]
}
export type NavPage = NavMenuBase
