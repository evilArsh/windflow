export interface LLMChatResponseHandler {
  restart: () => void
  terminate: () => void
}
export interface LLMChatRequestHandler {
  request: (message: string, callback: (message: LLMChatResponse) => void) => LLMChatResponseHandler
}

export interface LLMChatMessage {
  /**
   * 是否是推理对话
   */
  reasoning?: boolean
  /**
   * 对话内容
   */
  content: string
  /**
   * 推理内容
   */
  reasoningContent: string
}
export interface LLMChatResponse {
  status: number
  msg: string
  data: LLMChatMessage[]
}
