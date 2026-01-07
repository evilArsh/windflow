import { App, InjectionKey } from "vue"
import { MessageManager } from "@windflow/core/message"

export const ChatMessageKey: InjectionKey<MessageManager> = Symbol("chatMessage")
export const createChatMessage = () => {
  const msgMgr = markRaw(new MessageManager())
  return {
    install: (app: App<Element>) => {
      app.provide(ChatMessageKey, msgMgr)
    },
  }
}
export function useMessage(): MessageManager {
  const instance = inject(ChatMessageKey)
  if (!instance) {
    throw new Error("useMessage() is called outside of setup()")
  }
  return instance
}
