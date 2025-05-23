import {
  LLMChatResponse,
  Role,
  LLMToolCall,
  LLMChatMessage,
  LLMBaseRequest,
  LLMChatRequestHandler,
  ModelMeta,
  ProviderMeta,
} from "@renderer/types"
import { errorToText } from "@shared/error"
import { ContentType } from "@shared/code"
import { HttpCodeError, AbortError } from "./error"
import { callTools, loadMCPTools } from "../utils/mcp"
import { mergeRequestConfig } from "./utils"

function parseResponse(text: string, stream: boolean): LLMChatResponse {
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

async function* readLines(stream: ReadableStream<Uint8Array<ArrayBufferLike>>) {
  try {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      const lineStr = decoder.decode(value, { stream: !done })
      // console.log("[line]", lineStr)
      for (const line of lineStr.split(/\r?\n/).filter(v => !!v)) {
        yield line
      }
      if (done) break
    }
  } catch (error) {
    yield errorToText(error)
  }
}

async function* request(
  body: LLMBaseRequest,
  abortController: AbortController,
  providerMeta: ProviderMeta
): AsyncGenerator<LLMChatResponse> {
  const { api } = providerMeta
  const response = await fetch(resolvePath([api.url, api.llmChat.url], false), {
    method: api.llmChat.method,
    headers: {
      "Content-Type": ContentType.ApplicationJson,
      Authorization: `Bearer ${api.key}`,
    },
    body: JSON.stringify(body),
    signal: abortController.signal,
  })
  if (response.status >= 300) {
    const res = await response.text()
    throw new HttpCodeError(response.status, `HTTP error!,${res}`)
  }
  if (!response.body) {
    throw new Error("response body not found")
  }
  if (body.stream) {
    for await (const line of readLines(response.body)) {
      if (abortController.signal.aborted) {
        throw new AbortError("Request Aborted")
      }
      const parsedData = parseResponse(line, true)
      parsedData.stream = true
      yield parsedData
    }
  } else {
    const data = await response.text()
    yield parseResponse(data, false)
  }
}
export function useSingleLLMChat(): LLMChatRequestHandler {
  let abortController: AbortController | undefined
  function chat(message: LLMBaseRequest, providerMeta: ProviderMeta): AsyncGenerator<LLMChatResponse> {
    terminate()
    abortController = new AbortController()
    return request(message, abortController, providerMeta)
  }
  function terminate() {
    abortController?.abort("Request Aborted")
    abortController = undefined
  }
  return {
    chat,
    terminate,
  }
}

export async function makeRequest(
  context: LLMChatMessage[],
  providerMeta: ProviderMeta,
  modelMeta: ModelMeta,
  requestHandler: LLMChatRequestHandler,
  mcpServersIds: string[], // MCP服务器ID
  callback: (message: LLMChatResponse) => void,
  requestBody?: LLMBaseRequest
) {
  const partialToolCalls = usePartialToolCalls()
  const requestData = mergeRequestConfig(context, modelMeta, requestBody)
  try {
    callback({ status: 100, content: "", stream: requestData.stream, role: Role.Assistant })
    // 获取MCP工具列表
    const toolList = await loadMCPTools(mcpServersIds)
    // console.log("[load local MCP tools]", toolList)
    // 调用MCP工具并返回的调用结果
    let reqToolsData: LLMChatMessage[] = []
    // LLM返回的需要调用的工具列表
    let needCallTools: LLMToolCall[] = []
    if (toolList.length > 0) {
      // 携带tools信息请求
      for await (const content of requestHandler.chat(
        // tools:deepseek,tool_calls:openai
        { ...requestData, tools: toolList, tool_calls: toolList },
        providerMeta
      )) {
        partialToolCalls.add(content)
        if (content.status == 200) {
          needCallTools = partialToolCalls.getTools()
          if (needCallTools.length == 0) {
            callback(content)
          }
        } else if (!content.tool_calls && content.finish_reason !== "tool_calls") {
          // 1. 不是工具调用的消息
          // 2. [DONE]结束但是不是tool_calls结束
          // 3. 可能是推理消息，包含了reasoning_content
          callback(content) // 没有触发mcp工具调用
        }
      }
      // 没有触发MCP工具调用
      if (needCallTools.length == 0) return
      // console.log("[tools selected by LLM]", needCallTools)
      // 调用MCP工具并返回调用结果
      reqToolsData = await callTools(needCallTools)
      // console.log("[call local tools]", reqToolsData)
      if (reqToolsData.length == 0) return
      const response = partialToolCalls.getResponse()
      // console.log("[first time response]", response)
      const mcpToolsCallResponseMessage = partialToolCalls.getChatMessage()
      // console.log("[mcp tools call response]", mcpToolsCallResponseMessage)
      callback(response)
      context.push(mcpToolsCallResponseMessage)
    }
    // 处理工具调用结果
    const reqBody = mergeRequestConfig(context.concat(reqToolsData), modelMeta, requestData)
    reqToolsData.forEach(toolData => {
      callback({ ...toolData, status: 206, tool_calls_chain: true, stream: requestData.stream })
    })
    // 携带mcp调用结果请求
    for await (const content of requestHandler.chat(reqBody, providerMeta)) {
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

export function usePartialToolCalls() {
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
    if (data.usage) {
      result.usage = data.usage
    }
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
