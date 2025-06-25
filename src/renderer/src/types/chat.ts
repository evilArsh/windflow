import { HttpStatusCode } from "@shared/code"
import { LLMMessage, LLMRequestHandler, LLMProvider } from "."
import { MCPServerParam } from "@shared/types/mcp"
// import { MCPServerParam } from "@shared/types/mcp"
export type ChatMessageData = {
  /**
   * @description 单个消息ID
   */
  id: string
  /**
   * @description 当前消息使用的模型配置id
   */
  modelId: string
  /**
   * @description 当前消息为上下文分界点
   */
  contextFlag?: boolean
  /**
   * @description 消息时间
   */
  time: string
  /**
   * @description 消息内容,包含用户消息和模型返回的消息
   */
  content: LLMMessage
  /**
   * @description 请求是否完成，不管是否成功
   */
  finish?: boolean
  /**
   * @description 消息状态码
   */
  status: HttpStatusCode
  /**
   * @description 消息错误信息
   */
  msg?: string
  /**
   * @description 多个模型同时请求
   */
  children?: Array<ChatMessageData>
  parentId?: string
  /**
   * @description 本次请求中模型产生的token数
   */
  completionTokens?: number
  /**
   * @description 本次请求中用户输入的token数
   */
  promptTokens?: number
}
export type ChatMessage = {
  /**
   * @description 消息ID
   */
  id: string
  data: Array<ChatMessageData>
}
export type ChatTopic = {
  /**
   * @description 会话ID
   */
  id: string
  /**
   * @description 父会话id
   */
  parentId: string | null
  /**
   * @description 会话名称
   */
  label: string
  /**
   * @description 会话图标
   */
  icon: string
  /**
   * @description 当前会话聊天框输入内容
   */
  content: string
  /**
   * @description 当前会话提示词
   */
  prompt: string
  /**
   * @description 当前会话选择的模型配置id
   */
  modelIds: string[]
  /**
   * @description 会话输入框高度
   */
  inputHeight?: number
  /**
   * @description 正在请求的会话个数
   */
  requestCount: number
  /**
   * @description 会话聊天记录
   */
  chatMessageId?: string
  /**
   * @description 会话创建时间
   */
  createAt: number
}

export type TopicMcpServer = {
  topicId: string
} & MCPServerParam

export type ChatTopicTree = {
  id: string
  node: ChatTopic
  children: ChatTopicTree[]
}

export interface ChatContext {
  modelId: string
  /**
   * @description 当前消息ID
   */
  messageId: string
  /**
   * @description 当前子消息id
   */
  messageDataId: string
  provider?: LLMProvider
  handler?: LLMRequestHandler
}
