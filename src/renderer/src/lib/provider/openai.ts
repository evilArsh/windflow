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
  LLMToolCall,
} from "@renderer/types"

import { createInstance, useLLMChat } from "@renderer/lib/provider/http"
import { generateOpenAIChatRequest } from "./utils"
import { HttpStatusCode } from "@shared/code"
import { errorToText } from "@shared/error"
import { callOpenAITool, loadOpenAIMCPTools } from "./utils/mcp"
import { merge } from "lodash"
function usePartialToolCalls() {
  let tools: Record<number, LLMToolCall> = {}
  function clear() {
    tools = {}
  }
  function add(data: LLMChatResponse) {
    if (data.tool_calls) {
      data.tool_calls.forEach(tool => {
        if (isNumber(tool.index)) {
          const mapTool = tools[tool.index]
          if (mapTool) {
            mapTool.function.arguments = mapTool.function.arguments + tool.function.arguments
          } else {
            tools[tool.index] = tool
          }
        }
      })
    }
  }
  function content() {
    return Object.values(tools)
  }
  return { clear, add, content }
}
export abstract class OpenAICompatible implements LLMProvider {
  axios = createInstance()
  #handler: ReturnType<typeof useLLMChat> = useLLMChat()
  constructor() {}
  abstract fetchModels(provider: ProviderMeta): Promise<ModelMeta[]>

  parseResponse(text: string): LLMChatResponse {
    try {
      if (text.startsWith("data:")) {
        if (text.includes("[DONE]")) {
          return { role: Role.Assistant, status: HttpStatusCode.Ok, content: "", reasoning_content: "" }
        }
        const data = JSON.parse(text.replace(/data:/, ""))
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
    const partialToolCalls = usePartialToolCalls()
    this.#handler.update(this, providerMeta)
    const requestData = generateOpenAIChatRequest(messages, modelMeta, reqConfig)
    let requestHandler:
      | {
          terminate: () => void
          data: AsyncGenerator<LLMChatResponse>
        }
      | undefined = undefined

    // 获取MCP工具列表
    await loadOpenAIMCPTools(requestData)
    requestHandler = this.#handler.chat(requestData)
    setTimeout(async () => {
      for await (const cb of requestHandler.data) {
        cb.reasoning = modelMeta.type === ModelType.ChatReasoner
        if (cb.tool_calls) {
          partialToolCalls.add(cb)
        }
        callback(cb)
      }
      const tools = partialToolCalls.content()
      const reqToolsData = await callOpenAITool(tools)
      const toolRequestHandler = this.#handler.chat(
        generateOpenAIChatRequest(merge([], reqToolsData, messages), modelMeta, reqConfig)
      )
      for await (const cb of toolRequestHandler.data) {
        callback(cb)
      }
      console.log(reqToolsData)
    }, 0)
    return {
      restart: async () => {
        partialToolCalls.clear()
        // return await requestHandler?.restart()
      },
      terminate: () => {
        partialToolCalls.clear()
      },
      dispose: () => {
        partialToolCalls.clear()
      },
    }
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
