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
import { cloneDeep, errorToText } from "@shared/utils"
import { ContentType } from "@shared/code"
import { HttpCodeError, AbortError } from "./error"
import { callTools, loadMCPTools } from "../utils/mcp"
import { mergeRequestConfig, openAICompatParser, usePartialData } from "./utils"
async function* readLines(stream: ReadableStream<Uint8Array<ArrayBufferLike>>) {
  try {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      const lineStr = decoder.decode(value, { stream: !done })
      yield lineStr
      // console.log("[line]", lineStr)
      // for (const line of lineStr.split(/\r?\n/).filter(v => !!v)) {
      //   yield line
      // }
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
    throw new HttpCodeError(response.status, `[HTTP error] ${res}`)
  }
  if (!response.body) {
    throw new Error("response body not found")
  }
  if (body.stream) {
    for await (const line of readLines(response.body)) {
      if (abortController.signal.aborted) {
        throw new AbortError("Request Aborted")
      }
      for (const res of openAICompatParser.parseLLM(line, true)) {
        res.data.stream = true
        yield res
      }
    }
  } else {
    const data = await response.text()
    for (const res of openAICompatParser.parseLLM(data, false)) {
      yield res
    }
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
  const stream = requestBody?.stream ?? true
  const ctx = cloneDeep(context)
  try {
    callback({ status: 100, data: { content: "", stream, role: Role.Assistant } })
    // 获取MCP工具列表
    const toolList = await loadMCPTools(mcpServersIds)
    const appendTools = (req: LLMRequest, toolist: unknown) => {
      return {
        ...req,
        ...(isArray(toolist) && toolist.length ? { tools: toolist, tool_calls: toolist } : {}),
      }
    }
    console.log("[load local MCP tools]", toolList)
    // 调用MCP工具并返回的调用结果
    let callToolsResults: Message[] = []
    // LLM返回的需要调用的工具列表
    let neededCallTools: LLMToolCall[] = []
    while (true) {
      neededCallTools = partial.getTools()
      if (neededCallTools.length) {
        console.log("[tools selected by LLM]", neededCallTools)
        // 调用MCP工具并返回调用结果
        callToolsResults = await callTools(neededCallTools)
        console.log("[call local tools]", callToolsResults)
      }
      callToolsResults.forEach(callResult => {
        partial.addToolCallResults({ ...callResult, stream })
        const neededCalltool = neededCallTools.find(tool => tool.id === callResult.tool_call_id)
        if (neededCalltool) {
          ctx.push({
            role: Role.Assistant,
            tool_calls: [neededCalltool],
            content: "",
          })
          ctx.push(callResult)
        }
        callback(partial.getResponse())
      })
      partial.archiveTools()
      for await (const content of requestHandler.chat(
        appendTools(mergeRequestConfig(ctx, modelMeta, requestBody), toolList),
        providerMeta
      )) {
        partial.add(content)
        callback(partial.getResponse())
      }
      if (!partial.getTools().length) {
        partial.done()
        callback(partial.getResponse())
        break
      }
    }
  } catch (error) {
    if (error instanceof AbortError) {
      partial.add({
        msg: "request aborted",
        status: 499,
        data: { content: "", stream, role: Role.Assistant },
      })
      callback(partial.getResponse())
    } else if (error instanceof HttpCodeError) {
      partial.add({
        msg: error.message,
        status: error.code(),
        data: { content: "", stream, role: Role.Assistant },
      })
      callback(partial.getResponse())
    } else {
      partial.add({
        msg: errorToText(error),
        status: 500,
        data: { content: "", stream, role: Role.Assistant },
      })
      callback(partial.getResponse())
    }
  }
}
