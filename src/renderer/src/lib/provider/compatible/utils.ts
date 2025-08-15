import {
  LLMToolCall,
  LLMResponse,
  Role,
  Message,
  ModelMeta,
  LLMRequest,
  ProviderMeta,
  LLMToolCallRequest,
} from "@renderer/types"
import { AxiosInstance } from "axios"
import { cloneDeep, errorToText, merge } from "@shared/utils"

export function usePartialData() {
  const defaultMessage = (): Message => ({ role: Role.Assistant, content: "" })
  const defaultData = (): LLMResponse => ({ status: 100, data: defaultMessage(), msg: "" })
  const mergeString = (...strs: Array<string | null | undefined>): string => strs.filter(s => !!s).join("")
  let toolList: LLMToolCallRequest[] = []
  let current: Message = defaultMessage()
  let currentTools: Record<string, LLMToolCall> = {}
  let currentContent: string | undefined = ""
  let currentReasoningContent: string | undefined = ""
  let result: LLMResponse = defaultData()
  const resetCurrent = () => {
    current = defaultMessage()
    currentTools = {}
    currentContent = ""
    currentReasoningContent = ""
  }
  function add(newData: LLMResponse) {
    result.status = newData.status === 200 ? 206 : newData.status
    result.msg = mergeString(result.msg, newData.msg)
    currentContent = current.content as string
    currentReasoningContent = current.reasoning_content as string
    merge(current, newData.data)
    current.content = mergeString(currentContent, newData.data.content as string)
    current.reasoning_content = mergeString(currentReasoningContent, newData.data.reasoning_content as string)
    newData.data.tool_calls?.forEach(tool => {
      if (isNumber(tool.index)) {
        const mapTool = currentTools[tool.index]
        if (mapTool) {
          mapTool.function.arguments += tool.function.arguments
        } else {
          tool.serverId = toolList.find(t => t.function.name === tool.function.name)?.serverId ?? ""
          currentTools[tool.index] = tool
        }
      }
    })
  }
  function addToolCallResults(data: Message) {
    if (!current.tool_calls_chain) current.tool_calls_chain = []
    current.tool_calls_chain.push(data)
  }
  function done() {
    result.status = 200
  }
  function getTools(): LLMToolCall[] {
    return Object.values(currentTools)
  }
  /**
   * @description 归档当前tool calls loop,开启下一轮loop
   */
  function next() {
    current.tool_calls = getTools()
    if (!result.data.children) result.data.children = []
    result.data.children.push(current)
    if (!result.data.usage) {
      result.data.usage = current.usage
    } else {
      result.data.usage.completion_tokens += toNumber(current.usage?.completion_tokens)
      result.data.usage.prompt_tokens += toNumber(current.usage?.prompt_tokens)
      result.data.usage.total_tokens += toNumber(current.usage?.total_tokens)
    }
    resetCurrent()
  }
  function getResponse(): LLMResponse {
    return {
      ...result,
      data: {
        ...result.data,
        children: (result.data.children ?? []).concat([{ ...current, tool_calls: getTools() }]),
      },
    }
  }
  function reset() {
    resetCurrent()
    result = defaultData()
  }
  /**
   * 可用的mcp工具列表
   */
  function updateToolLists(lists: LLMToolCallRequest[]) {
    toolList = lists
  }
  return {
    reset,
    add,
    done,
    next,
    addToolCallResults,
    getTools,
    getResponse,
    updateToolLists,
  }
}
export function useOpenAICompatParser() {
  const regStart = /^\s*data:\s*/
  const regKeepalive = /:\s*keep-alive/
  const regJsonEdge = /^{.*}$/s
  const endFlag = "[DONE]"

  function parseLLM(text: string, stream: boolean): LLMResponse[] {
    try {
      if (stream) {
        const lines = text
          .split(/\r?\n/g)
          .filter(v => !!v)
          .reduce<string[]>((prev, cur) => {
            if (regKeepalive.test(cur)) {
              prev.push(cur)
            } else if (regStart.test(cur)) {
              prev.push(cur)
            } else {
              const latest = prev.length ? prev[prev.length - 1] : ""
              if (latest && regStart.test(latest)) {
                prev[prev.length - 1] = latest + cur
              }
            }
            return prev
          }, [])
        return lines.map<LLMResponse>(text => {
          if (regKeepalive.test(text)) {
            return {
              status: 102,
              data: { role: Role.Assistant, content: "", reasoning_content: "" },
            }
          } else if (regStart.test(text)) {
            const rawText = text.replace(regStart, "").trim()
            if (rawText.startsWith(endFlag)) {
              return {
                status: 200,
                data: { role: Role.Assistant, content: "", reasoning_content: "" },
              }
            }
            if (!regJsonEdge.test(rawText)) {
              return {
                status: 206,
                data: { role: Role.Assistant, content: "", reasoning_content: "" },
              }
            }
            const data = JSON.parse(rawText)
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
            return {
              msg: `[unrecognized start identifier in response text] '${text}'`,
              status: 400,
              data: { role: Role.Assistant, content: "", reasoning_content: "" },
            }
          }
        })
      } else {
        const data = JSON.parse(text)
        return [
          {
            status: 200,
            data: {
              role: data.choices[0].message.role,
              content: data.choices[0].message.content,
              reasoning_content: data.choices[0].message.reasoning_content ?? "",
              usage: data.usage,
              tool_calls: data.choices[0].message.tool_calls ?? data.choices[0].message.tools,
              finish_reason: data.choices[0].finish_reason,
            },
          },
        ]
      }
    } catch (error) {
      console.log("[parseResponse error]", error)
      return [
        {
          status: 200,
          msg: `{"error":${errorToText(error)},"text":${text}}`,
          data: { content: "", role: Role.Assistant },
        },
      ]
    }
  }

  return {
    parseLLM,
  }
}

export const openAICompatParser = useOpenAICompatParser()

export function mergeRequestConfig(messages: Message[], modelMeta: ModelMeta, req?: LLMRequest): LLMRequest {
  const conf: LLMRequest = {
    stream: true,
    ...req,
    model: modelMeta.modelName,
    messages: cloneDeep(messages),
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
