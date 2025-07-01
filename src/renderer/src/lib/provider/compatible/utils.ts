import { LLMToolCall, LLMResponse, Role, LLMMessage, ModelMeta, LLMRequest, ProviderMeta } from "@renderer/types"
import { AxiosInstance } from "axios"
import { errorToText } from "@shared/error"
import { cloneDeep, mergeWith } from "lodash"
import { join } from "lodash-es"

export function usePartialData() {
  let result: LLMResponse = defaultData()
  const toolsHistory: LLMToolCall[][] = []
  function defaultData(): LLMResponse {
    return { status: 100, data: { role: Role.Assistant, content: "" } }
  }
  function add(res: LLMResponse) {
    // 分片消息每次返回的消息都是完整的数据结构,只是同一个字段的字符串是分批返回的
    console.log(cloneDeep(result), cloneDeep(res))
    mergeWith(result, res, (objValue, srcValue, key) => {
      if (key === "content" || key === "reasoning_content" || key === "arguments") {
        if (!objValue) {
          return srcValue ?? ""
        } else if (!srcValue) {
          return objValue
        } else {
          return join([objValue, srcValue], "")
        }
      }
      if (srcValue === undefined || srcValue === null) {
        return objValue
      }
    })
  }
  /**
   * @description 归档当前tools,开启下一轮的tool_calls
   */
  function archiveTools() {
    if (result.data.tool_calls?.length) {
      toolsHistory.push(Array.from(result.data.tool_calls))
    }
    result.data.tool_calls = []
  }
  function addLocalMCPCallResults(data: LLMMessage) {
    if (!result.data.tool_calls_chain) result.data.tool_calls_chain = []
    result.data.tool_calls_chain.push(data)
  }
  function getTools(): LLMToolCall[] {
    return Array.from(result.data.tool_calls ?? [])
  }
  function getArchiveTools(): LLMToolCall[] {
    return toolsHistory.flat()
  }
  function getResponse(): LLMResponse {
    return {
      ...result,
      data: {
        ...result.data,
        tool_calls: getArchiveTools().concat(result.data.tool_calls ?? []),
        tool_calls_chain: result.data.tool_calls_chain ?? [],
      },
    }
  }
  function clear() {
    result = defaultData()
  }
  return {
    clear,
    add,
    archiveTools,
    getArchiveTools,
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
