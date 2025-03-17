import { Provider } from "./model/index"
export interface NavMenuBase {
  index: string
  label: string
  icon: string
  disabled?: boolean
  children?: NavMenuBase[]
}
export type NavPage = NavMenuBase

export type ChatTopic = {
  id: string
  label: string
  icon: string
  topic: string
  providers: Provider[]
  children: ChatTopic[]
}
