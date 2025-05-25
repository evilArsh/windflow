import { HttpStatusCode } from "@shared/code"
import { ProviderMeta } from "."

export enum Role {
  System = "system",
  User = "user",
  Assistant = "assistant",
  Tool = "tool",
  Developer = "developer",
}

// --- llm
export interface LLMBaseRequest {
  messages: LLMChatMessage[]
  model: string
  stream: boolean
  // temperature?: number
  // top_p?: number
  // presence_penalty?: number
  // frequency_penalty?: number
  // [x: string]: unknown
}
export type LLMContent = string | Record<string, unknown> | Array<Record<string, unknown>>
export interface LLMChatMessage {
  role: string
  /**
   * 消息内容
   */
  content: LLMContent
  /**
   * 推理内容
   */
  reasoning_content?: string
  /**
   * Role.Tool response
   */
  tool_call_id?: string
  /**
   * Role.Assistant response
   */
  tool_calls?: Array<LLMToolCall>
  // [x: string]: unknown
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

export interface LLMChatResponse extends LLMChatMessage {
  /**
   * 当前消息对应的状态码
   */
  status: HttpStatusCode
  /**
   * 状态码对应的提示信息
   */
  msg?: string
  /**
   * 是否是流式返回
   */
  stream?: boolean
  finish_reason?: string
  usage?: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
  }
}

export interface LLMChatRequestHandler {
  chat: (message: LLMBaseRequest, providerMeta: ProviderMeta) => AsyncGenerator<LLMChatResponse>
  terminate: () => void
}

// --- llm

// --- tti
export interface TextToImageRequest {
  model: string
  prompt: string
  /**
   * @description 图片尺寸
   */
  size?: string
  /**
   * @description 生成图片数量
   */
  n?: number
  /**
   * @description 随机种子
   */
  seed?: number
  // [x: string]: unknown
}
