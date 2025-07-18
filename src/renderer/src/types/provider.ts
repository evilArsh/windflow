import { Method } from "axios"
import { LLMRequest, Message, LLMResponse, MediaRequest, RequestHandler, MediaResponse } from "."
export enum ModelType {
  Chat = "Chat",
  ChatReasoner = "ChatReasoner",

  Embedding = "Embedding",

  Reranker = "Reranker",

  TextToImage = "TextToImage",
  ImageToText = "ImageToText",
  ImageToImage = "ImageToImage",

  TextToVideo = "TextToVideo",

  SpeechToText = "SpeechToText",
  TextToSpeech = "TextToSpeech",
}
export enum ModelActiveStatus {
  All = "All",
  Active = "Active",
  Inactive = "Inactive",
}
export type ModelsResponse = {
  object: string
  data: {
    id: string
    object?: string
    owned_by?: string
  }[]
}
export type ModelMeta = {
  id: string
  /**
   * @description 模型类型
   */
  type: Array<ModelType>
  /**
   * @description 厂商提供的模型名称(模型ID)
   */
  modelName: string
  /**
   * @description 提供商名称
   */
  providerName: string
  /**
   * @description 子提供商名称
   */
  subProviderName: string
  /**
   * @description 是否启用
   */
  active?: boolean
  // TODO:
  children?: ModelMeta[]
  icon?: string
}
/**
 * 服务提供商
 */
export type ProviderMeta = {
  id: string
  /**
   * @description 提供商名称
   */
  name: string
  logo: string
  /**
   * @description 别名
   */
  alias?: string
  /**
   * @description 是否是默认提供商
   */
  default?: boolean
  api: {
    url: string
    key: string
    doc?: string
    /**
     * @description 模型列表接口
     */
    models?: { method: Method; url: string }
    llmChat?: { method: Method; url: string }
    textToImage?: { method: Method; url: string }
    imageToText?: { method: Method; url: string }
    textToVideo?: { method: Method; url: string }
    speechToText?: { method: Method; url: string }
    textToSpeech?: { method: Method; url: string }
    /**
     * @description 账户信息接口
     */
    balance?: { method: Method; url: string }
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

/**
 * Large language model provider
 *
 */
export interface LLMProvider {
  chat(
    messages: Message[],
    model: ModelMeta,
    provider: ProviderMeta,
    mcpServersIds: Array<string>,
    callback: (message: LLMResponse) => void,
    reqConfig?: LLMRequest
  ): Promise<RequestHandler>
  summarize(
    context: string,
    model: ModelMeta,
    provider: ProviderMeta,
    callback: (message: LLMResponse) => void,
    reqConfig?: LLMRequest
  ): Promise<RequestHandler>
}

/**
 * @description media provider
 * Image,Video,Audio
 */
export interface MediaProvider {
  textToImage(
    message: MediaRequest,
    model: ModelMeta,
    provider: ProviderMeta,
    callback: (message: MediaResponse) => void
  ): Promise<RequestHandler>
}
// text-to-video
// video-to-text
// video-to-video
export interface Provider extends LLMProvider, MediaProvider {
  name(): string
  fetchModels(provider: ProviderMeta): Promise<ModelMeta[]>
}
export type DeepSeekBalance = {
  /**
   * @description 当前账户是否有余额可供 API 调用
   */
  is_available: boolean
  balance_infos: {
    /**
     * @description 货币，人民币或美元
     */
    currency: "CNY" | "USD"
    /**
     * @description 总的可用余额，包括赠金和充值余额
     */
    total_balance: string
    /**
     * @description 未过期的赠金余额
     */
    granted_balance: string
    /**
     * @description 充值余额
     */
    topped_up_balance: string
  }[]
}

export type SiliconFlowBalance = {
  code: number
  message: string
  status: boolean
  data: {
    id: string
    name: string
    image: string
    email: string
    isAdmin: boolean
    balance: string
    status: string
    introduction: string
    role: string
    chargeBalance: string
    totalBalance: string
  }
}
