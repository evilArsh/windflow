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
  LLMChatRequestHandler,
} from "@renderer/types"

import { createInstance, useSingleLLMChat } from "@renderer/lib/provider/http"
import { generateOpenAIChatRequest } from "./utils"
import { HttpStatusCode } from "@shared/code"
import { errorToText } from "@shared/error"
import { callOpenAITool, loadOpenAIMCPTools } from "./utils/mcp"
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
async function makeRequest(
  context: LLMChatMessage[],
  provider: LLMProvider,
  providerMeta: ProviderMeta,
  modelMeta: ModelMeta,
  requestHandler: LLMChatRequestHandler,
  toolRequestHandler: LLMChatRequestHandler,
  callback: (message: LLMChatResponse) => void,
  requestBody?: LLMBaseRequest
) {
  const partialToolCalls = usePartialToolCalls()
  const requestData = generateOpenAIChatRequest(context, modelMeta, requestBody)
  // 获取MCP工具列表
  await loadOpenAIMCPTools(requestData)
  for await (const content of requestHandler.chat(requestData, provider, providerMeta)) {
    content.reasoning = modelMeta.type === ModelType.ChatReasoner
    if (content.tool_calls) {
      partialToolCalls.add(content)
    }
    callback(content)
  }
  // 调用MCP工具
  const tools = partialToolCalls.content()
  if (tools.length == 0) return
  console.log("[tools invoke params]", tools)
  const reqToolsData = await callOpenAITool(tools)
  if (reqToolsData.length == 0) return
  // 处理工具调用结果
  const reqBody = generateOpenAIChatRequest(context.concat(reqToolsData), modelMeta, requestBody)
  for await (const cb of toolRequestHandler.chat(reqBody, provider, providerMeta)) {
    callback(cb)
  }
}
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
    // chat调用
    const requestHandler = useSingleLLMChat()
    // tool调用
    const toolRequestHandler = useSingleLLMChat()
    const context = Array.from(messages)
    const terminate = () => {
      toolRequestHandler.terminate()
      requestHandler.terminate()
    }
    const restart = async () => {
      terminate()
      makeRequest(context, this, providerMeta, modelMeta, requestHandler, toolRequestHandler, callback, reqConfig)
    }
    const dispose = () => {}
    restart()
    return {
      restart,
      terminate,
      dispose,
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
