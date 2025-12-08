import {
  LLMResponse,
  Role,
  LLMToolCall,
  Message,
  LLMConfig,
  ModelMeta,
  ProviderMeta,
  BeforeRequestCallback,
  RequestHandler,
  LLMToolCallRequest,
  LLMContent,
} from "@windflow/core/types"
import OpenAISDK from "openai"
import { callTools, loadMCPTools } from "../utils/mcp"
import { cloneDeep, errorToText, isArray, isString } from "@toolmain/shared"
import type {
  EasyInputMessage,
  ResponseFunctionToolCall,
  ResponseInput,
  ResponseInputContent,
  ResponseInputFile,
  ResponseInputImage,
  ResponseInputItem,
  ResponseInputText,
  Tool,
} from "openai/resources/responses/responses"
import { usePartialData } from "../compatible/utils"
import { AbortError, HttpCodeError } from "../compatible/error"
import { nonStreamParse, streamParse } from "./stream"
import { Stream } from "openai/core/streaming.mjs"

export function useHandler(): RequestHandler {
  let abortController = new AbortController()
  function terminate() {
    abortController.abort("Request Aborted")
  }
  function setController(controller: AbortController) {
    terminate()
    abortController = controller
  }
  return {
    getSignal: () => abortController.signal,
    setController,
    terminate,
  }
}
const transformContent = (content: LLMContent) => {
  if (content.type == "image") {
    const res: ResponseInputImage = {
      type: "input_image",
      detail: "auto",
      image_url: content.content,
    }
    return res
  } else if (content.type == "file") {
    const res: ResponseInputFile = {
      type: "input_file",
      file_data: content.content,
    }
    return res
  } else {
    const res: ResponseInputText = {
      type: "input_text",
      text: content.content,
    }
    return res
  }
}
const messagesTransform = (messages: Message[]): ResponseInput => {
  return messages.map((msg: Message): ResponseInputItem => {
    if (msg.type == "function_call_output") {
      const res: ResponseInputItem.FunctionCallOutput = {
        type: "function_call_output",
        call_id: msg.call_id as string,
        output: msg.output as string,
      }
      return res
    } else if (msg.type == "function_call") {
      const res: ResponseFunctionToolCall = {
        type: "function_call",
        call_id: msg.call_id as string,
        name: msg.name as string,
        arguments: msg.arguments as string,
      }
      return res
    }
    if (isString(msg.content)) {
      return {
        role: msg.role as "user" | "assistant" | "system" | "developer",
        content: msg.content,
      }
    } else if (isArray(msg.content)) {
      const res: EasyInputMessage = {
        role: msg.role as "user" | "assistant" | "system" | "developer",
        content: msg.content.map<ResponseInputContent>((item: LLMContent | string) => {
          if (isString(item)) {
            const res: ResponseInputText = {
              type: "input_text",
              text: item,
            }
            return res
          } else {
            return transformContent(item)
          }
        }),
      }
      return res
    } else {
      const res: EasyInputMessage = {
        role: msg.role as "user" | "assistant" | "system" | "developer",
        content: [transformContent(msg.content)],
      }
      return res
    }
  })
}
const toolsTransform = (tools: LLMToolCallRequest[]): Tool[] => {
  return tools.map(t => {
    return {
      type: "function",
      name: t.function.name,
      strict: false,
      parameters: t.function.parameters ?? null,
      description: t.function.description,
    }
  })
}
export async function makeRequest(
  client: OpenAISDK,
  context: Message[],
  providerMeta: ProviderMeta,
  modelMeta: ModelMeta,
  requestHandler: RequestHandler,
  callback: (message: LLMResponse) => void,
  beforeRequest?: BeforeRequestCallback
) {
  callback({ status: 100, data: { content: "", role: Role.Assistant } })
  const partial = usePartialData()
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
    let neededCallTools: LLMToolCall[] = []
    let callToolResults: Message[] = []
    while (true) {
      const response = await client.responses.create(
        {
          stream: requestBody?.stream,
          model: modelMetaCopy.modelName,
          input: messagesTransform(contextCopy),
          tools: toolsTransform(toolList),
          max_output_tokens: requestBody?.max_tokens,
          temperature: requestBody?.temperature,
          top_p: requestBody?.top_p,
        },
        {
          signal: requestHandler.getSignal(),
          path: providerMeta.api.llmChat?.url,
          method: providerMeta.api.llmChat?.method as any,
        }
      )
      if (requestBody?.stream) {
        await streamParse(partial, response as Stream<OpenAISDK.Responses.ResponseStreamEvent>, callback)
      } else {
        await nonStreamParse(partial, response as OpenAISDK.Responses.Response, callback)
      }
      neededCallTools = partial.getTools()
      if (neededCallTools.length) {
        callToolResults = await callTools(neededCallTools)
        callToolResults.forEach(callResult => {
          partial.addToolCallResults(callResult)
          const neededCalltool = neededCallTools.find(tool => tool.id === callResult.tool_call_id)
          const meta: LLMToolCall | undefined = neededCallTools.find(t => t.id === callResult.tool_call_id)
          if (neededCalltool) {
            contextCopy.push({
              role: "",
              content: "",
              type: "function_call",
              call_id: callResult.tool_call_id,
              name: meta?.function.name,
              arguments: meta?.function.arguments,
            })
            contextCopy.push({
              role: "",
              content: "",
              type: "function_call_output",
              call_id: callResult.tool_call_id,
              output: callResult.content,
            })
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
    console.error(error)
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
