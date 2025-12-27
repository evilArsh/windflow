import { ChatMessageKey } from "@renderer/app/hooks/useMessage"
import { MessageManager } from "@windflow/core/message"

export function useMessage(): MessageManager {
  const instance = inject(ChatMessageKey)
  if (!instance) {
    throw new Error("useMessage() is called outside of setup()")
  }
  return instance
}
