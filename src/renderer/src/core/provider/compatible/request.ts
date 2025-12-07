import {
  LLMResponse,
  Role,
  LLMToolCall,
  Message,
  LLMConfig,
  LLMRequestHandler,
  ModelMeta,
  ProviderMeta,
  BeforeRequestCallback,
} from "../../types"
import { HttpCodeError, AbortError } from "./error"
import { callTools, loadMCPTools } from "../utils/mcp"
import { mergeRequestConfig, openAICompatParser, usePartialData } from "./utils"
import { errorToText, resolvePath, ContentType, cloneDeep, isArray } from "@toolmain/shared"
async function* readLines(stream: ReadableStream<Uint8Array<ArrayBufferLike>>) {
  try {
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      const lineStr = decoder.decode(value, { stream: !done })
      yield lineStr
      if (done) break
    }
  } catch (error) {
    yield errorToText(error)
  }
}

async function* request(
  body: LLMConfig,
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
  let abortController: AbortController = new AbortController()
  /**
   * you should terminate first before chat
   */
  function chat(message: LLMConfig, providerMeta: ProviderMeta): AsyncGenerator<LLMResponse> {
    return request(message, abortController, providerMeta)
  }
  function terminate() {
    abortController.abort("Request Aborted")
  }
  function getSignal() {
    return abortController.signal
  }
  function setController(controller: AbortController) {
    terminate()
    abortController = controller
  }
  return {
    getSignal,
    setController,
    chat,
    terminate,
  }
}

export async function makeRequest(
  context: Message[],
  providerMeta: ProviderMeta,
  modelMeta: ModelMeta,
  requestHandler: LLMRequestHandler,
  callback: (message: LLMResponse) => void,
  beforeRequest?: BeforeRequestCallback
) {
  const partial = usePartialData()
  callback({ status: 100, data: { content: "", role: Role.Assistant } })
  try {
    let contextCopy = cloneDeep(context)
    let providerMetaCopy = cloneDeep(providerMeta)
    let modelMetaCopy = cloneDeep(modelMeta)
    let mcpServersIds: string[] = []
    let requestBody: LLMConfig | undefined
    // hooks start
    if (beforeRequest) {
      const resp = await beforeRequest(contextCopy, modelMetaCopy, providerMetaCopy)
      contextCopy = resp.messages
      modelMetaCopy = resp.model
      providerMetaCopy = resp.provider
      mcpServersIds = resp.mcpServersIds
      requestBody = resp.reqConfig
    }
    // hooks end
    const toolList = await loadMCPTools(mcpServersIds)
    partial.updateToolLists(toolList)
    const appendTools = (req: LLMConfig, toolist: unknown) => {
      return { ...req, ...(isArray(toolist) && toolist.length ? { tools: toolist, tool_calls: toolist } : {}) }
    }
    let neededCallTools: LLMToolCall[] = []
    let callToolResults: Message[] = []
    while (true) {
      for await (const content of requestHandler.chat(
        appendTools(mergeRequestConfig(contextCopy, modelMetaCopy, requestBody), toolList),
        providerMetaCopy
      )) {
        partial.add(content)
        callback(partial.getResponse())
      }
      neededCallTools = partial.getTools()
      if (neededCallTools.length) {
        callToolResults = await callTools(neededCallTools)
        console.log("[call result]", callToolResults)
        callToolResults.forEach(callResult => {
          partial.addToolCallResults(callResult)
          const neededCalltool = neededCallTools.find(tool => tool.id === callResult.tool_call_id)
          if (neededCalltool) {
            contextCopy.push({ role: Role.Assistant, tool_calls: [neededCalltool], content: "" })
            contextCopy.push(callResult)
          }
          callback(partial.getResponse())
        })
        partial.next()
      } else {
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
        data: { content: "", role: Role.Assistant },
      })
      callback(partial.getResponse())
    } else if (error instanceof HttpCodeError) {
      partial.add({
        msg: error.message,
        status: error.code(),
        data: { content: "", role: Role.Assistant },
      })
      callback(partial.getResponse())
    } else {
      partial.add({
        msg: errorToText(error),
        status: 500,
        data: { content: "", role: Role.Assistant },
      })
      callback(partial.getResponse())
    }
  }
}
