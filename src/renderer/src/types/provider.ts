import { Method } from "axios"
import { LLMBaseRequest, LLMChatMessage, LLMChatResponse, LLMChatResponseHandler } from "."
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
export enum ProviderName {
  System = "System",
  DeepSeek = "DeepSeek",
  SiliconFlow = "SiliconFlow",
  Volcengine = "Volcengine",
  OpenAI = "OpenAI",
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
    object: string
    owned_by: string
    created: number
  }[]
}
export type ModelMeta = {
  id: string
  /**
   * @description 模型类型
   */
  type: ModelType
  /**
   * @description 厂商提供的模型名称(模型ID)
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
  // TODO:
  children?: ModelMeta[]
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
  apiDoc?: string
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

export interface Provider {
  fetchModels(provider: ProviderMeta): Promise<ModelMeta[]>
}
export interface LLMProvider extends Provider {
  chat(
    messages: LLMChatMessage[],
    model: ModelMeta,
    provider: ProviderMeta,
    callback: (message: LLMChatResponse) => void,
    reqConfig?: LLMBaseRequest
  ): Promise<LLMChatResponseHandler>
  parseResponse(text: string): LLMChatResponse
}

// text-to-image

// image-to-text

// image-to-image

// text-to-video

// video-to-text

// video-to-video
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
