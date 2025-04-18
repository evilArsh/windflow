import { HttpStatusCode } from "@shared/code"
import { LLMProvider, ProviderMeta } from "."

export enum Role {
  System = "system",
  User = "user",
  Assistant = "assistant",
  Tool = "tool",
  Developer = "developer",
}

export interface LLMBaseRequest {
  stream?: boolean
  [x: string]: unknown
}
export type LLMContent = string | Record<string, unknown> | Array<Record<string, unknown>>
export interface LLMChatMessage {
  role: "system" | "user" | "assistant" | "tool" | "developer"
  /**
   * 消息内容
   */
  content: LLMContent
  /**
   * 推理内容
   */
  reasoning_content?: string
  //  Role.Tool
  tool_call_id?: string
  //  Role.Assistant
  tool_calls?: Array<LLMToolCall>
}

export interface LLMToolCall {
  function: {
    arguments: string
    name: string
  }
  id?: string
  type: "function"
  index?: number
}

export interface LLMChatResponse {
  role: string
  /**
   * 消息内容
   */
  content: string
  /**
   * 推理内容
   */
  reasoning_content?: string
  /**
   * 当前消息对应的状态码
   */
  status: HttpStatusCode
  /**
   * 状态码对应的提示信息
   */
  msg?: string
  /**
   * 是否是推理对话
   */
  reasoning?: boolean
  stream?: boolean
  tool_calls?: Array<LLMToolCall>
  usage?: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
  }
}

export interface LLMChatResponseHandler {
  restart: () => Promise<void>
  terminate: () => void
  dispose: () => void
}
export interface LLMChatRequestHandler {
  chat: (message: LLMBaseRequest, provider: LLMProvider, providerMeta: ProviderMeta) => AsyncGenerator<LLMChatResponse>
  terminate: () => void
}

// ---------------------
