import { HttpStatusCode } from "@toolmain/shared"
import { ProviderMeta, RequestHandler } from "@windflow/core/types"

export enum Role {
  System = "system",
  User = "user",
  Assistant = "assistant",
  Tool = "tool",
  Developer = "developer",
}

// --- llm
/**
 * All LLM models request configs must be compitable with these fields
 */
export type LLMConfig = {
  /**
   * streaming mode
   */
  stream?: boolean
  temperature?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
  max_tokens?: number
  // [x: string]: unknown
}
export type LLMContent = {
  /**
   * * platform required:
   *
   * 1. openai: `image` `text` `file` or more in `ResponseInputItem`
   */
  type: string
  content: string
}
export type Content = string | LLMContent | Array<LLMContent> | string[]
export interface Message {
  role: string
  content: Content
  reasoning_content?: string
  /**
   * was set by LLM to identify each tool call function
   */
  tool_call_id?: string
  /**
   * tools selected by LLM and need to be executed locally
   */
  tool_calls?: Array<LLMToolCall>
  /**
   * tool call resluts
   */
  tool_calls_chain?: Array<Message>
  /**
   * each request may contain multiple rounds of conversation messages, including tool calls
   */
  children?: Array<Message>
  finish_reason?: string
  usage?: {
    completion_tokens: number
    prompt_tokens: number
    total_tokens: number
  }
  /**
   * some other fields that on specified platforms
   */
  [x: string]: unknown
}
/**
 * tool callls params that send to LLM
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
 * tool calls params that receive from LLM
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
   * status code of current response
   */
  status: HttpStatusCode
  /**
   * message of current response
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
   * numbers of image generated
   *
   * * field mapping:
   *
   * 1.siliconflow: batch_size === n
   */
  n: number
  /**
   * size of image generated
   *
   * * field mapping:
   *
   * 1.siliconflow: image_size ===  size
   */
  size?: string
  /**
   * * platform required:
   *
   * 1. siliconflow
   */
  num_inference_steps?: number
  /**
   * * platform required:
   *
   * 1.siliconflow
   */
  guidance_scale?: number
  /**
   * * platform required:
   *
   * 1. siliconflow
   */
  negative_prompt?: string
  /**
   * random seed
   */
  seed?: number
}
export interface ImageResponse {
  data: Message
  /**
   * status code of current response
   */
  status: HttpStatusCode
  /**
   * message of current response
   */
  msg?: string
}
export interface MediaRequest {
  [x: string]: unknown
}
