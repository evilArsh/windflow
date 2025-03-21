import { HttpStatusCode, Method } from "axios"
import { LLMChatMessage } from "./index"

export enum ProviderName {
  System = "System",
  DeepSeek = "DeepSeek",
  SiliconFlow = "SiliconFlow",
}
export enum ModelType {
  LLM_CHAT = "LLM_CHAT",
  LLM_REASONER = "LLM_REASONER",
  Embedding = "Embedding",
}
/**
 * 服务提供商
 */
export type ProviderConfig = {
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
  disabled?: boolean
  modelIds: string[]
}
export type ModelConfig = {
  id: string
  name: string
  type: ModelType
  providerName: ProviderName
  description?: string
  group?: string
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
  models: ModelConfig[]
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
  chatMessages: {
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
    model: ModelConfig
    /**
     * @description 消息时间
     */
    time: string
  }[]
}
