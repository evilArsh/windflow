import { LLMChatMessage, ModelMeta, LLMBaseRequest, ProviderMeta } from "@renderer/types"
import { AxiosInstance } from "axios"

export function mergeRequestConfig(
  messages: LLMChatMessage[],
  modelMeta: ModelMeta,
  req?: LLMBaseRequest
): LLMBaseRequest {
  const conf: LLMBaseRequest = {
    // max_tokens: 4096,
    stream: true,
    ...req,
    model: modelMeta.modelName,
    messages,
    n: 1,
    response_format: { type: "text" },
  }
  return conf
}

export function generateSummaryText(context: string) {
  return `
Summarize a title in ${window.defaultLanguage ?? "简体中文"}
within 15 characters without punctuation based on the following content:\n"${context}"
`
}

export function patchAxios(provider: ProviderMeta, instance: AxiosInstance) {
  instance.defaults.baseURL = provider.apiUrl
  instance.defaults.headers.common["Authorization"] = `Bearer ${provider.apiKey}`
}
