import { ProviderConfig } from "./index"

export type LLMChatMessage = {
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
export type LLMChatResponse = {
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

export interface LLMProvider<T = unknown> {
  request(
    message: LLMChatMessage | LLMChatMessage[],
    callback: (message: LLMChatResponse) => void
  ): LLMChatResponseHandler
  /**
   * @description 覆盖设置请求参数
   */
  setMessageConfig(config: T): void
  /**
   * @description 更新请求参数
   */
  updateMessageConfig(config: T): void
  getMessageConfig(): T
  parseResponse(text: string): LLMChatResponse
  isReasoning(): boolean
  getRequestBody(message: LLMChatMessage | LLMChatMessage[]): Record<string, unknown>
  getConfig(): ProviderConfig
}
