import {
  LLMChatMessage,
  LLMChatResponse,
  LLMProvider,
  ProviderMeta,
  ModelMeta,
  LLMBaseRequest,
  Role,
  LLMChatRequestHandler,
} from "@renderer/types"
import { createInstance, useSingleLLMChat } from "./http"
import { generateOpenAIChatRequest } from "./utils"
import { errorToText } from "@shared/error"
import { makeRequest } from "./utils/openai"

export abstract class OpenAICompatible implements LLMProvider {
  axios = createInstance()
  constructor() {}
  abstract fetchModels(provider: ProviderMeta): Promise<ModelMeta[]>

  parseResponse(text: string, stream: boolean): LLMChatResponse {
    try {
      if (text.includes(":keep-alive")) {
        return { role: Role.Assistant, status: 102, content: "", reasoning_content: "" }
      } else if (stream) {
        text = text.replace(/^data:/, "").trim()
        if (!text) {
          return { role: Role.Assistant, status: 206, content: "", reasoning_content: "" }
        }
        if (text.includes("[DONE]")) {
          return { role: Role.Assistant, status: 200, content: "", reasoning_content: "" }
        }
        const data = JSON.parse(text)
        return {
          role: data.choices[0].delta.role,
          status: 206,
          content: data.choices[0].delta.content ?? "",
          reasoning_content: data.choices[0].delta.reasoning_content ?? "",
          usage: data.usage,
          tool_calls: data.choices[0].delta.tool_calls ?? data.choices[0].delta.tools,
          finish_reason: data.choices[0].finish_reason,
        }
      } else {
        try {
          const data = JSON.parse(text)
          return {
            role: data.choices[0].message.role,
            status: 200,
            content: data.choices[0].message.content,
            reasoning_content: data.choices[0].message.reasoning_content ?? "",
            usage: data.usage,
            tool_calls: data.choices[0].message.tool_calls ?? data.choices[0].message.tools,
            finish_reason: data.choices[0].finish_reason,
          }
        } catch (error) {
          return { role: Role.Assistant, status: 200, content: errorToText(error), reasoning_content: "" }
        }
      }
    } catch (error) {
      console.log("[parseResponse error]", error, text)
      return { status: 206, msg: "", content: errorToText(error), role: Role.Assistant }
    }
  }

  chat(
    messages: LLMChatMessage[],
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    mcpServersIds: string[],
    callback: (message: LLMChatResponse) => void,
    reqConfig?: LLMBaseRequest
  ): LLMChatRequestHandler {
    // chat调用
    const requestHandler = useSingleLLMChat()
    const context = Array.from(messages)
    makeRequest(context, this, providerMeta, modelMeta, requestHandler, mcpServersIds, callback, reqConfig)
    return requestHandler
  }

  async titleSummary(
    context: string,
    modelMeta: ModelMeta,
    provider: ProviderMeta,
    reqConfig?: LLMBaseRequest
  ): Promise<string> {
    const text = `Summarize a title in ${window.defaultLanguage ?? "简体中文"} within 15 characters without punctuation based on the following content:\n"${context}"`
    const requestData = generateOpenAIChatRequest([{ role: Role.User, content: text }], modelMeta, reqConfig)
    requestData.stream = false
    const requestHandler = useSingleLLMChat()
    for await (const content of requestHandler.chat(requestData, this, provider)) {
      if (isString(content.content)) {
        return content.content
      }
    }
    return ""
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
