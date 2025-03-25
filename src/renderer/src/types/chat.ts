import { HttpStatusCode, Method } from "axios"

export enum ProviderName {
  System = "System",
  DeepSeek = "DeepSeek",
  SiliconFlow = "SiliconFlow",
}
export enum ModelType {
  Chat = "Chat",
  ChatReasoner = "ChatReasoner",
  Embedding = "Embedding",
  Reranker = "Reranker",
  TextToImage = "TextToImage",
  ImageToImage = "ImageToImage",
  TextToVideo = "TextToVideo",
  SpeechToText = "SpeechToText",
}
export enum ModelActiveStatus {
  All = "All",
  Active = "Active",
  Inactive = "Inactive",
}
export interface LLMBaseRequest {
  [x: string]: unknown
}
export type LLMChatMessage = {
  /**
   * 消息类型
   */
  role: string
  /**
   * 消息内容
   */
  content: string
  /**
   * 推理内容
   */
  reasoningContent?: string
  [x: string]: unknown
}

export type LLMChatResponse = {
  /**
   * 当前消息对应的状态码
   */
  status: HttpStatusCode
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

/**
 * 服务提供商
 */
export type ProviderMeta = {
  /**
   * @description 提供商名称,unique
   */
  name: ProviderName
  logo: string
  alias?: string
  apiUrl: string
  apiKey: string
  /**
   * @description 是否是默认提供商
   */
  default?: boolean
  /**
   * @description 平台模型列表接口
   */
  apiModelList: {
    method: Method
    url: string
  }
  /**
   * @description 平台LLM聊天接口
   */
  apiLLMChat: {
    method: Method
    url: string
  }
  /**
   * @description 平台账户信息接口
   */
  apiBalance: {
    method: Method
    url: string
  }
  /**
   * @description 模型列表中需要展示的模型类型
   */
  selectedTypes: string[]
  /**
   * @description 模型列表中需要展示的子提供商
   */
  selectedSubProviders: string[]
  /**
   * @description 模型列表中展示激活状态的模型
   */
  activeStatus?: ModelActiveStatus
}
export type ModelMeta = {
  id: string
  /**
   * @description 模型类型
   */
  type: ModelType
  /**
   * @description 厂商提供的模型名称
   */
  modelName: string
  /**
   * @description 提供商名称
   */
  providerName: ProviderName
  /**
   * @description 子提供商名称
   */
  subProviderName: string
  /**
   * @description 是否启用
   */
  active?: boolean
  children?: ModelMeta[]
}
export type ChatTopicMessage = {
  /**
   * @description 请求是否完成，不管是否成功
   */
  finish?: boolean
  /**
   * @description 消息ID
   */
  id: string
  /**
   * @description 消息状态码
   */
  status: HttpStatusCode
  /**
   * @description 消息错误信息
   */
  msg?: string
  /**
   * @description 是否是推理对话
   */
  reasoning?: boolean
  /**
   * @description 消息内容,包含用户消息和模型返回的消息
   */
  content: LLMChatMessage
  /**
   * @description 当前消息使用的模型配置id
   */
  modelId: string
  /**
   * @description 消息时间
   */
  time: string
}
export type ChatTopic = {
  /**
   * @description 会话ID
   */
  id: string
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
   * @description 当前会话选择的模型配置id
   */
  modelIds: string[]
  /**
   * @description 会话子会话
   */
  children: ChatTopic[]
  /**
   * @description 会话滚动位置
   */
  scrollY?: number
  /**
   * @description 会话聊天记录
   */
  chatMessages: ChatTopicMessage[]
}

export interface LLMChatResponseHandler {
  restart: () => void
  terminate: () => void
}
export interface LLMChatRequestHandler {
  chat: (message: LLMBaseRequest, callback: (message: LLMChatResponse) => void) => LLMChatResponseHandler
}
export interface Provider {
  fetchModels(provider: ProviderMeta): Promise<ModelMeta[]>
}
export interface LLMProvider extends Provider {
  chat(
    message: LLMChatMessage | LLMChatMessage[],
    model: ModelMeta,
    provider: ProviderMeta,
    callback: (message: LLMChatResponse) => void,
    reqConfig?: LLMBaseRequest
  ): LLMChatResponseHandler
  parseResponse(text: string): LLMChatResponse
}

// text-to-image

// image-to-text

// image-to-image

// text-to-video

// video-to-text

// video-to-video
