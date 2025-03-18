import { Method } from "axios"
import { LLMChatMessage } from "../index"

export enum ProviderName {
  System = "System",
  DeepSeek = "DeepSeek",
  SiliconFlow = "SiliconFlow",
}
/**
 * 服务提供商
 */
export interface Provider {
  id: string
  name: string
  logo: string
  alias?: string
  apiUrl: string
  apiKey: string
  /**
   * @description 平台模型列表接口
   */
  apiModelList: {
    method: Method | string
    url: string
  }
  /**
   * @description 平台LLM聊天接口
   */
  apiLLMChat: {
    method: Method | string
    url: string
  }
  /**
   * @description 平台账户信息接口
   */
  apiBalance: {
    method: Method | string
    url: string
  }
  disabled?: boolean
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
   * @description 当前会话服务提供商id
   */
  providers: string[]
  /**
   * @description 会话子会话
   */
  children: ChatTopic[]
  /**
   * @description 会话聊天记录
   */
  chatMessages: {
    /**
     * @description 消息ID
     */
    id: string
    /**
     * @description 消息内容
     */
    content: LLMChatMessage
    /**
     * @description 消息提供商ID
     */
    providerId: string
    /**
     * @description 消息时间
     */
    time: string
  }[]
}
