import {
  LLMChatMessage,
  LLMChatResponse,
  LLMChatResponseHandler,
  LLMProvider,
  ProviderMeta,
  ModelMeta,
  ModelType,
  LLMBaseRequest,
  Role,
} from "@renderer/types"

import { createInstance, useLLMChat } from "@renderer/lib/provider/http"
import JSON5 from "json5"
import { generateOpenAIChatRequest } from "./utils"
import { HttpStatusCode } from "@shared/code"
import { errorToText } from "@shared/error"
import { loadOpenAIMCPTools } from "./utils/mcp"
export abstract class OpenAICompatible implements LLMProvider {
  axios = createInstance()
  constructor() {}
  abstract fetchModels(provider: ProviderMeta): Promise<ModelMeta[]>

  parseResponse(text: string): LLMChatResponse {
    try {
      if (text.startsWith("data:")) {
        if (text.includes("[DONE]")) {
          return { role: Role.Assistant, status: HttpStatusCode.Ok, content: "", reasoning_content: "" }
        }
        const data = JSON5.parse(text.replace(/data:/, ""))
        return {
          role: Role.Assistant,
          status: HttpStatusCode.PartialContent,
          content: data.choices[0].delta.content ?? "",
          reasoning_content: data.choices[0].delta.reasoning_content ?? "",
          usage: data.usage ?? undefined,
          tool_calls: data.choices[0].delta.tool_calls ?? data.choices[0].delta.tools ?? undefined,
        }
      } else if (text.includes(":keep-alive")) {
        return { role: Role.Assistant, status: HttpStatusCode.Processing, content: "", reasoning_content: "" }
      } else {
        return { role: Role.Assistant, status: HttpStatusCode.PartialContent, content: "", reasoning_content: "" }
      }
    } catch (error) {
      console.log("[parseResponse error]", error)
      return { status: HttpStatusCode.PartialContent, msg: "", content: errorToText(error), role: Role.Assistant }
    }
  }
  async chat(
    messages: LLMChatMessage[],
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    callback: (message: LLMChatResponse) => void,
    reqConfig?: LLMBaseRequest
  ): Promise<LLMChatResponseHandler> {
    const request = useLLMChat(this, providerMeta)
    const requestData = generateOpenAIChatRequest(messages, modelMeta, reqConfig)
    // 获取MCP工具列表
    await loadOpenAIMCPTools(requestData)
    const handler = request.chat(requestData, async cb => {
      console.log("[OpenAI chat]", cb)
      cb.reasoning = modelMeta.type === ModelType.ChatReasoner
      callback(cb)
    })
    return handler
  }
}

export class OpenAI extends OpenAICompatible {
  constructor() {
    super()
  }
  async fetchModels(_provider: ProviderMeta): Promise<ModelMeta[]> {
    return []
  }
}
