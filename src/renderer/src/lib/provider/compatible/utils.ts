import { LLMToolCall, LLMResponse, Role, LLMMessage, ModelMeta, LLMRequest, ProviderMeta } from "@renderer/types"
import { AxiosInstance } from "axios"
import { errorToText } from "@shared/error"
import { HttpStatusCode } from "@shared/code"

export function usePartialData() {
  let result: LLMResponse = defaultData()
  let tools: Record<number, LLMToolCall> = {}
  let content = ""
  let reasoning_content = ""
  const tool_calls_chain: LLMMessage[] = []
  const usage = {
    completion_tokens: 0,
    prompt_tokens: 0,
    total_tokens: 0,
  }

  function defaultData(): LLMResponse {
    return { status: 100, data: { role: Role.Assistant, content: "" } }
  }
  function assembleData(result: LLMResponse): LLMResponse {
    result.data.content = content
    result.data.reasoning_content = reasoning_content
    const tool = getTools()
    result.data.tool_calls = tool.length > 0 ? tool : undefined
    result.data.usage = usage
    result.data.tool_calls_chain = tool_calls_chain
    return result
  }
  function calcTokens(data: LLMMessage) {
    if (data.finish_reason) {
      usage.completion_tokens += toNumber(data.usage?.completion_tokens)
      usage.prompt_tokens += toNumber(data.usage?.prompt_tokens)
      usage.total_tokens += toNumber(data.usage?.total_tokens)
    }
    // else {
    //   if (data.usage) {
    //     usage.completion_tokens = data.usage.completion_tokens
    //     usage.prompt_tokens = data.usage.prompt_tokens
    //     usage.total_tokens = data.usage.total_tokens
    //   }
    // }
  }
  function add(res: LLMResponse) {
    const { data } = res
    // 分片消息每次返回的消息都是完整的数据结构,只是同一个字段的字符串是分批返回的
    content += data.content ?? ""
    reasoning_content += data.reasoning_content ?? ""
    Object.assign(result, res)
    if (data.tool_calls) {
      data.tool_calls.forEach(tool => {
        if (isNumber(tool.index)) {
          const mapTool = tools[tool.index]
          if (mapTool) {
            mapTool.function.arguments += tool.function.arguments
            // mapTool.function.name
          } else {
            tools[tool.index] = tool
          }
        }
      })
    }
    calcTokens(data)
  }
  function addLocalMCPCallResults(data: LLMMessage) {
    tool_calls_chain.push(data)
  }
  function getTools(): LLMToolCall[] {
    return Object.values(tools)
  }
  function getResponse(): LLMResponse {
    return assembleData(result)
  }
  function clear() {
    tools = {}
    content = ""
    reasoning_content = ""
    usage.completion_tokens = 0
    usage.prompt_tokens = 0
    usage.total_tokens = 0
    tool_calls_chain.length = 0
    result = defaultData()
  }
  return {
    clear,
    add,
    addLocalMCPCallResults,
    getTools,
    getResponse,
  }
}

export function parseResponse(text: string, stream: boolean): LLMResponse {
  try {
    if (text.includes(":keep-alive")) {
      return {
        status: 102,
        data: {
          role: Role.Assistant,
          content: "",
          reasoning_content: "",
        },
      }
    } else if (stream) {
      text = text.replace(/^data:/, "").trim()
      if (!text) {
        return {
          status: 206,
          data: {
            role: Role.Assistant,
            content: "",
            reasoning_content: "",
          },
        }
      }
      if (text.includes("[DONE]")) {
        return {
          status: 200,
          data: {
            role: Role.Assistant,
            content: "",
            reasoning_content: "",
          },
        }
      }
      const data = JSON.parse(text)
      return {
        status: 206,
        data: {
          role: data.choices[0].delta.role,
          content: data.choices[0].delta.content ?? "",
          reasoning_content: data.choices[0].delta.reasoning_content ?? "",
          usage: data.usage,
          tool_calls: data.choices[0].delta.tool_calls ?? data.choices[0].delta.tools,
          finish_reason: data.choices[0].finish_reason,
        },
      }
    } else {
      try {
        const data = JSON.parse(text)
        return {
          status: 200,
          data: {
            role: data.choices[0].message.role,
            content: data.choices[0].message.content,
            reasoning_content: data.choices[0].message.reasoning_content ?? "",
            usage: data.usage,
            tool_calls: data.choices[0].message.tool_calls ?? data.choices[0].message.tools,
            finish_reason: data.choices[0].finish_reason,
          },
        }
      } catch (error) {
        return {
          status: 200,
          data: {
            role: Role.Assistant,
            content: errorToText(error),
            reasoning_content: "",
          },
        }
      }
    }
  } catch (error) {
    console.log("[parseResponse error]", error, text)
    return {
      status: 206,
      msg: "",
      data: {
        content: errorToText(error),
        role: Role.Assistant,
      },
    }
  }
}

export function mergeRequestConfig(messages: LLMMessage[], modelMeta: ModelMeta, req?: LLMRequest): LLMRequest {
  const conf: LLMRequest = {
    // max_tokens: 4096,
    stream: true,
    ...req,
    model: modelMeta.modelName,
    messages,
    n: 1,
    response_format: { type: "text" },
  }
  return conf
}

export function generateSummaryText(context: string) {
  return `
Summarize a title in ${window.defaultLanguage ?? "简体中文"}
within 15 characters without any punctuation and cut the crap,based on the following content:\n"${context}"
`
}

export function patchAxios(provider: ProviderMeta, instance: AxiosInstance) {
  instance.defaults.baseURL = provider.api.url
  instance.defaults.headers.common["Authorization"] = `Bearer ${provider.api.key}`
}

export function response(status: HttpStatusCode, data: LLMMessage, msg?: string): LLMResponse {
  return {
    status,
    data,
    msg,
  }
}
