import { LLMBaseRequest, LLMChatMessage, ModelMeta, ProviderMeta } from "@renderer/types"
import { AxiosInstance } from "axios"

export function generateOpenAIChatRequest(
  messages: LLMChatMessage[],
  modelMeta: ModelMeta,
  req?: LLMBaseRequest
): LLMBaseRequest {
  const config: LLMBaseRequest = req ?? {
    stream: true,
    max_tokens: 8192,
    n: 1,
    response_format: {
      type: "text",
    },
  }
  const conf: Record<string, any> = {
    ...config,
    messages,
    model: modelMeta.modelName,
  }
  const mn = modelMeta.modelName.toLowerCase()
  if (mn.includes("deepseek")) {
    conf.max_tokens = Math.min(8192, conf.max_tokens ?? 8192)
  } else {
    conf.max_tokens = Math.min(4096, conf.max_tokens ?? 4096)
  }
  return conf
}

export function patchInstance(provider: ProviderMeta, instance: AxiosInstance) {
  instance.defaults.baseURL = provider.apiUrl
  instance.defaults.headers.common["Authorization"] = `Bearer ${provider.apiKey}`
}
