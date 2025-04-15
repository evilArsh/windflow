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
import { HttpStatusCode } from "./http/index"
export abstract class OpenAICompatible implements LLMProvider {
  axios = createInstance()
  constructor() {}
  abstract fetchModels(provider: ProviderMeta): Promise<ModelMeta[]>

  parseResponse(text: string): LLMChatResponse {
    try {
      if (text.startsWith("data:")) {
        const data = JSON5.parse(text.replace(/data:/, ""))
        return {
          role: Role.Assistant,
          status: HttpStatusCode.PartialContent,
          content: data.choices[0].delta.content ?? "",
          reasoning_content: data.choices[0].delta.reasoning_content ?? "",
        }
      } else {
        return {
          role: Role.Assistant,
          status: HttpStatusCode.PartialContent,
          content: "",
          reasoning_content: "",
        }
      }
    } catch (error) {
      return {
        status: HttpStatusCode.PartialContent,
        msg: "",
        content: dataToText(error),
        role: Role.Assistant,
      }
    }
  }
  chat(
    messages: LLMChatMessage[],
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    callback: (message: LLMChatResponse) => void,
    reqConfig?: LLMBaseRequest
  ): LLMChatResponseHandler {
    const request = useLLMChat(this, providerMeta)
    const requestData = generateOpenAIChatRequest(messages, modelMeta, reqConfig)
    return request.chat(requestData, modelMeta.type === ModelType.ChatReasoner, cb => {
      callback({
        ...cb,
        reasoning: modelMeta.type === ModelType.ChatReasoner,
      })
    })
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
