import {
  LLMResponse,
  Role,
  LLMToolCall,
  Message,
  LLMRequest,
  LLMRequestHandler,
  ModelMeta,
  ProviderMeta,
} from "@renderer/types"
import { errorToText } from "@shared/error"
import { ContentType } from "@shared/code"
import { HttpCodeError, AbortError } from "./error"
import { callTools, loadMCPTools } from "../utils/mcp"
import { mergeRequestConfig, parseResponse, usePartialData } from "./utils"
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
  body: LLMRequest,
  abortController: AbortController,
  providerMeta: ProviderMeta
): AsyncGenerator<LLMResponse> {
  const { api } = providerMeta
  const response = await fetch(resolvePath([api.url, api.llmChat?.url ?? ""], false), {
    method: api.llmChat?.method,
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
      parsedData.data.stream = true
      yield parsedData
    }
  } else {
    const data = await response.text()
    yield parseResponse(data, false)
  }
}
export function useSingleLLMChat(): LLMRequestHandler {
  let abortController: AbortController | undefined
  function chat(message: LLMRequest, providerMeta: ProviderMeta): AsyncGenerator<LLMResponse> {
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
  context: Message[],
  providerMeta: ProviderMeta,
  modelMeta: ModelMeta,
  requestHandler: LLMRequestHandler,
  mcpServersIds: string[], // MCP服务器ID
  callback: (message: LLMResponse) => void,
  requestBody?: LLMRequest
) {
  const partial = usePartialData()
  const requestData = mergeRequestConfig(context, modelMeta, requestBody)
  try {
    callback({ status: 100, data: { content: "", stream: requestData.stream, role: Role.Assistant } })
    // 获取MCP工具列表
    const toolList = await loadMCPTools(mcpServersIds)
    console.log("[load local MCP tools]", toolList)
    // 调用MCP工具并返回的调用结果
    let reqToolsData: Message[] = []
    // LLM返回的需要调用的工具列表
    let neededCallTools: LLMToolCall[] = []
    while (true) {
      if (toolList.length > 0) {
        if (!neededCallTools.length) {
          // 携带tools信息请求
          const req = { ...requestData, tools: toolList, tool_calls: toolList }
          for await (const content of requestHandler.chat(req, providerMeta)) {
            partial.add({ ...content, status: content.status == 200 ? 206 : content.status })
            callback(partial.getResponse())
          }
          neededCallTools = partial.getTools()
          // 没有触发MCP工具调用
          if (!neededCallTools.length) {
            partial.add({ status: 200, data: { role: Role.Assistant, content: "" } })
            callback(partial.getResponse())
            return
          }
        }
        console.log("[tools selected by LLM]", neededCallTools)
        // 调用MCP工具并返回调用结果
        reqToolsData = await callTools(neededCallTools)
        console.log("[call local tools]", reqToolsData)
        if (!reqToolsData.length) {
          partial.add({ status: 200, data: { role: Role.Assistant, content: "" } })
          callback(partial.getResponse())
          return
        }
        // 添加大模型选择的tool_calls作为上下文
        context.push({
          role: Role.Assistant,
          tool_calls: neededCallTools,
          content: "",
        })
      }
      reqToolsData.forEach(toolData => {
        partial.addLocalMCPCallResults({ ...toolData, stream: requestData.stream })
        context.push(toolData)
      })
      callback(partial.getResponse())
      // 处理工具调用结果
      const reqBody = mergeRequestConfig(context, modelMeta, requestData)
      partial.archiveTools()
      // 携带mcp调用结果请求
      for await (const content of requestHandler.chat(reqBody, providerMeta)) {
        partial.add(content)
        callback(partial.getResponse())
      }
      neededCallTools = partial.getTools()
      if (!neededCallTools.length) break
    }
  } catch (error) {
    if (error instanceof AbortError) {
      partial.add({ status: 499, data: { content: "", stream: requestData.stream, role: Role.Assistant } })
      callback(partial.getResponse())
    } else if (error instanceof HttpCodeError) {
      partial.add({
        status: error.code(),
        data: { content: error.message, stream: requestData.stream, role: Role.Assistant },
      })
      callback(partial.getResponse())
    } else {
      partial.add({
        status: 500,
        data: { content: errorToText(error), stream: requestData.stream, role: Role.Assistant },
      })
      callback(partial.getResponse())
    }
  }
}
