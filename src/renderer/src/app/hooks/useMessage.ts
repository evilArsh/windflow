import { App, InjectionKey } from "vue"
import { MessageManager } from "@windflow/core/message"
export const ChatMessageKey: InjectionKey<MessageManager> = Symbol("chatMessage")
export const useMessage = async (app: App<Element>) => {
  const msgMgr = markRaw(new MessageManager())
  app.provide(ChatMessageKey, msgMgr)
}
