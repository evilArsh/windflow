import { HttpStatusCode } from "@shared/code"
import { ProviderMeta } from "."
import { AxiosResponse, AxiosRequestConfig, AxiosInstance } from "axios"

export enum Role {
  System = "system",
  User = "user",
  Assistant = "assistant",
  Tool = "tool",
  Developer = "developer",
}

export interface RequestHandler {
  terminate: () => void
}
export interface GeneralRequestHandler extends RequestHandler {
  request: <T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>) => Promise<R>
  getInstance: () => AxiosInstance
}
// --- llm
export interface LLMRequest {
  stream?: boolean
  [x: string]: unknown
}
export type Content = string | Record<string, unknown> | Array<Record<string, unknown>> | string[]
export interface Message {
  role: string
  /**
   * 消息内容
   */
  content: Content
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
  /**
   * mcp工具调用结果
   */
  tool_calls_chain?: Array<Message>
  /**
   * 多轮对话消息
   */
  children?: Array<Message>
  finish_reason?: string
  usage?: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
  }
  // [x: string]: unknown
}
/**
 * 发送给LLM的tool calls参数
 */
export interface LLMToolCallRequest {
  /**
   * mcp server id
   */
  serverId: string
  type: "function"
  function: {
    name: string
    description?: string
    parameters?: {
      [x: string]: unknown
    }
  }
}
/**
 * LLM返回的tool calls参数
 */
export interface LLMToolCall {
  function: {
    arguments: string
    name: string
  }
  id?: string
  type: "function"
  index?: number
  /**
   * mcp server id
   */
  serverId: string
}

export interface LLMResponse {
  data: Message
  /**
   * 当前消息对应的状态码
   */
  status: HttpStatusCode
  /**
   * 状态码对应的提示信息
   */
  msg?: string
}
export interface LLMRequestHandler extends RequestHandler {
  chat: (message: LLMRequest, providerMeta: ProviderMeta) => AsyncGenerator<LLMResponse>
}
// --- llm

// --- media
export interface ImageResponse {
  data: Message
  /**
   * 当前消息对应的状态码
   */
  status: HttpStatusCode
  /**
   * 状态码对应的提示信息
   */
  msg?: string
}
export interface MediaRequest {
  [x: string]: unknown
}
