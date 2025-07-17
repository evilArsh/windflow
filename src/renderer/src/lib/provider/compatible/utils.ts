import { LLMToolCall, LLMResponse, Role, LLMMessage, ModelMeta, LLMRequest, ProviderMeta } from "@renderer/types"
import { AxiosInstance } from "axios"
import { errorToText } from "@shared/error"
import { merge } from "lodash-es"

export function usePartialData() {
  let result: LLMResponse = defaultData()
  let tools: Record<string, LLMToolCall> = {}
  const toolsHistory: LLMToolCall[][] = []
  const tool_calls_chain: LLMMessage[] = []
  const content: string[] = []
  const reasoning_content: string[] = []

  function defaultData(): LLMResponse {
    return { status: 100, data: { role: Role.Assistant, content: "" } }
  }
  function add(res: LLMResponse) {
    result = merge({}, result, res)
    content.push((res.data.content as string) ?? "")
    reasoning_content.push((res.data.reasoning_content as string) ?? "")
    res.data.tool_calls?.forEach(tool => {
      if (isNumber(tool.index)) {
        const mapTool = tools[tool.index]
        if (mapTool) {
          mapTool.function.arguments += tool.function.arguments
        } else {
          tools[tool.index] = tool
        }
      }
    })
  }
  function getTools(): LLMToolCall[] {
    return Object.values(tools)
  }
  /**
   * @description 归档当前tools,开启下一轮的tool_calls
   */
  function archiveTools() {
    toolsHistory.push(getTools())
    tools = {}
  }
  function addLocalMCPCallResults(data: LLMMessage) {
    tool_calls_chain.push(data)
  }
  function getResponse(): LLMResponse {
    result.data.content = content.filter(s => !!s).join("")
    result.data.reasoning_content = reasoning_content.filter(s => !!s).join("")
    result.data.tool_calls = toolsHistory.flat().concat(getTools())
    result.data.tool_calls_chain = tool_calls_chain
    return result
  }
  function reset() {
    tools = {}
    content.length = 0
    reasoning_content.length = 0
    tool_calls_chain.length = 0
    toolsHistory.length = 0
    result = defaultData()
  }
  return {
    reset,
    add,
    archiveTools,
    addLocalMCPCallResults,
    getTools,
    getResponse,
  }
}

export function parseResponse(text: string, stream: boolean): LLMResponse {
  try {
    if (/:\s*keep-alive/.test(text)) {
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
      status: 200,
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
