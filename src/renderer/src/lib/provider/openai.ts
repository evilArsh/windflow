import {
  LLMChatMessage,
  LLMChatResponse,
  LLMChatResponseHandler,
  LLMProvider,
  ProviderMeta,
  ModelMeta,
  LLMBaseRequest,
  Role,
  LLMToolCall,
  LLMChatRequestHandler,
} from "@renderer/types"

import { createInstance, useSingleLLMChat, AbortError, HttpCodeError } from "./http"
import { generateOpenAIChatRequest } from "./utils"
import { HttpStatusCode } from "@shared/code"
import { errorToText } from "@shared/error"
import { callTools, loadMCPTools } from "./utils/mcp"
function usePartialToolCalls() {
  const result: LLMChatResponse = {
    role: Role.Assistant,
    status: 206,
    content: "",
  }
  let tools: Record<number, LLMToolCall> = {}
  function clear() {
    tools = {}
    result.content = ""
    result.usage = undefined
    result.finish_reason = undefined
    result.tool_calls = undefined
  }
  function add(data: LLMChatResponse) {
    // 分片消息每次返回的消息都是完整的数据结构,只是同一个字段的字符串是分批返回的
    result.content += data.content
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
    if (data.usage) result.usage = data.usage
    if (result.finish_reason) result.finish_reason = data.finish_reason
  }
  function getTools(): LLMToolCall[] {
    return Object.values(tools)
  }
  /**
   * @description 返回结果是一个完整的消息结构,包含了所有的工具选择列表和消息内容
   * @returns LLMChatResponse
   */
  function getResponse(): LLMChatResponse {
    return {
      ...result,
      tool_calls: Object.values(tools),
      status: 200,
    }
  }
  /**
   * @description 返回的工具列表消息用作下次带上工具响应结果请求的上下文
   */
  function getChatMessage(): LLMChatMessage {
    return {
      role: result.role,
      content: result.content,
      tool_calls: Object.values(tools),
    } as LLMChatMessage
  }
  return { clear, add, getTools, getResponse, getChatMessage }
}
async function makeRequest(
  context: LLMChatMessage[],
  provider: LLMProvider,
  providerMeta: ProviderMeta,
  modelMeta: ModelMeta,
  requestHandler: LLMChatRequestHandler,
  mcpServersIds: string[], // MCP服务器ID
  callback: (message: LLMChatResponse) => void,
  requestBody?: LLMBaseRequest
) {
  const partialToolCalls = usePartialToolCalls()
  const requestData = generateOpenAIChatRequest(context, modelMeta, requestBody)
  try {
    // 获取MCP工具列表并写入body中
    const toolList = await loadMCPTools(mcpServersIds)
    // 调用MCP工具并返回的调用结果
    let reqToolsData: LLMChatMessage[] = []
    if (toolList.length > 0) {
      requestData["tool_calls"] = toolList // openai
      requestData["tools"] = toolList // deepseek
      // 携带tools信息请求数据
      for await (const content of requestHandler.chat(requestData, provider, providerMeta)) {
        if (content.tool_calls) {
          partialToolCalls.add(content)
        }
      }
      const tools = partialToolCalls.getTools()
      if (tools.length == 0) {
        callback(partialToolCalls.getResponse())
        return
      }
      console.log("[tools selected by LLM]", tools)
      // 调用MCP工具并返回调用结果
      reqToolsData = await callTools(tools)
      if (reqToolsData.length == 0) return
      context.push(partialToolCalls.getChatMessage()) // TODO: 需要返回给外部作为一个上下文?
    }
    // 处理工具调用结果
    const reqBody = generateOpenAIChatRequest(context.concat(reqToolsData), modelMeta, requestData)
    // 携带mcp 调用结果请求数据
    for await (const content of requestHandler.chat(reqBody, provider, providerMeta)) {
      callback(content)
    }
  } catch (error) {
    if (error instanceof AbortError) {
      callback({
        status: 499,
        content: "",
        stream: requestData.stream,
        role: Role.Assistant,
      })
      return
    } else if (error instanceof HttpCodeError) {
      callback({
        status: error.code(),
        content: error.message,
        stream: requestData.stream,
        role: Role.Assistant,
      })
      return
    }
    callback({
      status: 500,
      content: errorToText(error),
      stream: requestData.stream,
      role: Role.Assistant,
    })
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
          status: 206,
          content: data.choices[0].delta.content ?? "",
          reasoning_content: data.choices[0].delta.reasoning_content ?? "",
          usage: data.usage ?? undefined,
          tool_calls: data.choices[0].delta.tool_calls ?? data.choices[0].delta.tools ?? undefined,
          finish_reason: data.choices[0].finish_reason ?? undefined,
        }
      } else if (text.includes(":keep-alive")) {
        return { role: Role.Assistant, status: HttpStatusCode.Processing, content: "", reasoning_content: "" }
      } else {
        try {
          const data = JSON.parse(text)
          return {
            role: Role.Assistant,
            status: HttpStatusCode.Ok,
            content: data.choices[0].message.content,
            reasoning_content: data.choices[0].message.reasoning_content ?? "",
            usage: data.usage ?? undefined,
            tool_calls: data.choices[0].message.tool_calls ?? data.choices[0].message.tools ?? undefined,
            finish_reason: data.choices[0].finish_reason ?? undefined,
          }
        } catch (error) {
          return { role: Role.Assistant, status: 200, content: errorToText(error), reasoning_content: "" }
        }
      }
    } catch (error) {
      console.log("[parseResponse error]", error)
      return { status: 206, msg: "", content: errorToText(error), role: Role.Assistant }
    }
  }

  async chat(
    messages: LLMChatMessage[],
    modelMeta: ModelMeta,
    providerMeta: ProviderMeta,
    mcpServersIds: string[],
    callback: (message: LLMChatResponse) => void,
    reqConfig?: LLMBaseRequest
  ): Promise<LLMChatResponseHandler> {
    // chat调用
    const requestHandler = useSingleLLMChat()
    const context = Array.from(messages)
    // TODO: 加入mcp服务prompts
    const terminate = () => {
      requestHandler.terminate()
    }
    const restart = async () => {
      terminate()
      makeRequest(context, this, providerMeta, modelMeta, requestHandler, mcpServersIds, callback, reqConfig)
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
