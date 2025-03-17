import { Method } from "axios"

export enum ProviderName {
  DeepSeek = "DeepSeek",
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
