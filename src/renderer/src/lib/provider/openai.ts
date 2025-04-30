import {
  LLMChatMessage,
  LLMChatResponse,
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
    if (isString(data.content)) {
      result.content += data.content
    } else {
      console.warn("[PartialToolCalls] content is not string", data.content)
    }
    if (data.tool_calls) {
      data.tool_calls.forEach(tool => {
        if (isNumber(tool.index)) {
          const mapTool = tools[tool.index]
          if (mapTool) {
            mapTool.function.arguments += tool.function.arguments
            // name
          } else {
            tools[tool.index] = tool
          }
        }
      })
    }
    result.usage = data.usage
    result.finish_reason = data.finish_reason
  }
  function getTools(): LLMToolCall[] {
    return Object.values(tools)
  }
  /**
   * @description 返回结果是一个完整的消息结构,包含tool_calls列表和消息内容，
   * 是LLM的一次响应
   * @returns LLMChatResponse
   */
  function getResponse(): LLMChatResponse {
    return {
      ...result,
      tool_calls: Object.values(tools),
      tool_calls_chain: true,
      status: 206,
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
    callback({ status: 100, content: "", stream: requestData.stream, role: Role.Assistant })
    // 获取MCP工具列表
    const toolList = await loadMCPTools(mcpServersIds)
    // 调用MCP工具并返回的调用结果
    let reqToolsData: LLMChatMessage[] = []
    // LLM返回的需要调用的工具列表
    let needCallTools: LLMToolCall[] = []
    if (toolList.length > 0) {
      // 携带tools信息请求
      for await (const content of requestHandler.chat(
        // tools:deepseek,tool_calls:openai
        { ...requestData, tools: toolList, tool_calls: toolList },
        provider,
        providerMeta
      )) {
        partialToolCalls.add(content)
        if (content.status == 200) {
          needCallTools = partialToolCalls.getTools()
          if (needCallTools.length == 0) {
            callback(content)
          }
        } else if (!content.tool_calls && (content.content || content.finish_reason !== "tool_calls")) {
          // 1. 不是工具调用的消息
          // 2. [DONE]结束但是不是tool_calls结束
          callback(content) // 没有触发mcp工具调用
        }
      }
      // 没有触发MCP工具调用
      if (needCallTools.length == 0) return
      console.log("[tools selected by LLM]", needCallTools)
      // 调用MCP工具并返回调用结果
      reqToolsData = await callTools(needCallTools)
      if (reqToolsData.length == 0) return
      callback(partialToolCalls.getResponse())
      const mcpToolsCallResponseMessage = partialToolCalls.getChatMessage()
      context.push(mcpToolsCallResponseMessage)
    }
    // 处理工具调用结果
    const reqBody = generateOpenAIChatRequest(context.concat(reqToolsData), modelMeta, requestData)
    reqToolsData.forEach(toolData => {
      callback({ ...toolData, status: 206, tool_calls_chain: true, stream: requestData.stream })
    })
    // 携带mcp调用结果请求
    for await (const content of requestHandler.chat(reqBody, provider, providerMeta)) {
      callback(content)
    }
  } catch (error) {
    if (error instanceof AbortError) {
      callback({ status: 499, content: "", stream: requestData.stream, role: Role.Assistant })
    } else if (error instanceof HttpCodeError) {
      callback({ status: error.code(), content: error.message, stream: requestData.stream, role: Role.Assistant })
    } else {
      callback({ status: 500, content: errorToText(error), stream: requestData.stream, role: Role.Assistant })
    }
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
          return { role: Role.Assistant, status: 200, content: "", reasoning_content: "" }
        }
        const data = JSON.parse(text.replace(/data:/, ""))
        return {
          role: Role.Assistant,
          status: 206,
          content: data.choices[0].delta.content ?? "",
          reasoning_content: data.choices[0].delta.reasoning_content ?? "",
          usage: data.usage,
          tool_calls: data.choices[0].delta.tool_calls ?? data.choices[0].delta.tools,
          finish_reason: data.choices[0].finish_reason,
        }
      } else if (text.includes(":keep-alive")) {
        return { role: Role.Assistant, status: 102, content: "", reasoning_content: "" }
      } else {
        try {
          const data = JSON.parse(text)
          return {
            role: Role.Assistant,
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
      console.log("[parseResponse error]", error)
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
