export interface LLMChatResponseHandler {
  restart: () => void
  terminate: () => void
}
export interface LLMChatRequestHandler {
  request: (
    message: LLMChatMessage | LLMChatMessage[],
    callback: (message: LLMChatResponse) => void
  ) => LLMChatResponseHandler
}

export interface LLMChatMessage {
  /**
   * 消息类型
   */
  role: "user" | "assistant" | "system"
  /**
   * 消息内容
   */
  content: string
  /**
   * 推理内容
   */
  reasoningContent?: string
}
export interface LLMChatResponse {
  /**
   * 当前消息对应的状态码
   */
  status: number
  /**
   * 状态码对应的提示信息
   */
  msg: string
  /**
   * 消息内容
   */
  data: LLMChatMessage[]
  /**
   * 是否是推理对话
   */
  reasoning?: boolean
}
