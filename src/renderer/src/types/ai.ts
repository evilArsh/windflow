import { HttpStatusCode } from "@toolmain/shared"
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
  getSignal: () => AbortSignal
  /**
   * maby you want to use your own controller
   */
  setController: (controller: AbortController) => void
  terminate: () => void
}
export interface GeneralRequestHandler extends RequestHandler {
  request: <T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>) => Promise<R>
  getInstance: () => AxiosInstance
}
// --- llm
export type LLMConfig = {
  /**
   * @description 是否流式返回
   */
  stream?: boolean
  /**
   * @description 模型温度
   */
  temperature?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  max_tokens?: number
  // [x: string]: unknown
}
export type LLMContent = {
  /**
   * in openai: `image` `text` `file` or more in `ResponseInputItem`
   */
  type: string
  content: string
}
export type Content = string | LLMContent | Array<LLMContent> | string[]
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
   * 每个请求可能存在多轮对话消息，包括tool_calls
   */
  children?: Array<Message>
  finish_reason?: string
  usage?: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
  }
  /**
   * some other fields which are in the specified platforms
   */
  [x: string]: unknown
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
  /**
   * in openai, it's the call_id
   *
   * in compatible mode, it's set by llm model
   */
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
  chat: (message: LLMConfig, providerMeta: ProviderMeta) => AsyncGenerator<LLMResponse>
}
// --- llm

// --- media
export type TTIConfig = {
  /**
   * @description 生成图片的大小。
   * 1.siliconflow: batch_size === n
   */
  n: number
  /**
   * @description 图片尺寸。
   * 1.siliconflow: image_size ===  size
   */
  size?: string
  /**
   * @description 推理步数。
   * 平台：siliconflow
   */
  num_inference_steps?: number
  /**
   * @description 引导权重。
   * 平台：siliconflow
   */
  guidance_scale?: number
  /**
   * @description 反向提示词。
   * 平台：siliconflow
   */
  negative_prompt?: string
  /**
   * @description 随机种子
   */
  seed?: number
}
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
