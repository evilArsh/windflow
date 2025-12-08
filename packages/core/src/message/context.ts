import { ChatContext, ChatContextMeta, Provider, RequestHandler } from "@windflow/core/types"

class ChatContextImpl implements ChatContext {
  #ctx: Map<string, ChatContextMeta[]>
  constructor() {
    this.#ctx = new Map()
  }
  create(meta: ChatContextMeta) {
    const exist = this.get(meta.topicId, meta.modelId)
    if (exist) return exist
    const scope = this.#ctx.get(meta.topicId) ?? []
    const m = { ...meta }
    scope.push(m)
    if (!this.has(meta.topicId)) this.#ctx.set(meta.topicId, scope)
    return { ...m }
  }
  has(topicId: string) {
    return this.#ctx.has(topicId)
  }
  get(topicId: string, messageId: string): ChatContextMeta | undefined {
    return this.getAll(topicId)?.find(item => item.messageId === messageId)
  }
  getAll(topicId: string): ChatContextMeta[] | undefined {
    return this.#ctx.get(topicId)
  }
  remove(topicId: string, messageId?: string) {
    const all = this.getAll(topicId)
    if (messageId) {
      if (!all) return 0
      const index = all.findIndex(item => item.messageId === messageId)
      if (index === -1) return 0
      const res = all.splice(index, 1)
      res.forEach(item => {
        item.handler?.terminate()
      })
      return res.length
    } else {
      all?.forEach(item => {
        item.handler?.terminate()
      })
      this.#ctx.delete(topicId)
      return all?.length || 0
    }
  }
  setProvider(topicId: string, messageId: string, provider: Provider): boolean {
    const chatContext = this.get(topicId, messageId)
    if (chatContext) {
      chatContext.provider = provider
      return true
    }
    return false
  }
  setHandler(topicId: string, messageId: string, handler: RequestHandler): boolean {
    const chatContext = this.get(topicId, messageId)
    if (chatContext) {
      chatContext.handler = handler
      return true
    }
    return false
  }
}

export function createChatContext(): ChatContext {
  return new ChatContextImpl()
}
