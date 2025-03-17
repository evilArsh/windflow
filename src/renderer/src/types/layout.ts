import { Provider } from "./model/index"
export interface NavMenuBase {
  index: string
  label: string
  icon: string
  disabled?: boolean
  children?: NavMenuBase[]
}
export type NavPage = NavMenuBase

export type ChatGroup = {
  label: string
  logo: string
  topic: string
  providers: Provider[]
  children: ChatGroup[]
}
