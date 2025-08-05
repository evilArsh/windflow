import { LLMToolCall, LLMResponse, Role, Message, ModelMeta, LLMRequest, ProviderMeta } from "@renderer/types"
import { AxiosInstance } from "axios"
import { cloneDeep, errorToText, merge } from "@shared/utils"

export function usePartialData() {
  let result: LLMResponse = defaultData()
  let tools: Record<string, LLMToolCall> = {}
  const toolsHistory: LLMToolCall[][] = []
  const tool_calls_chain: Message[] = []
  const content: string[] = []
  const reasoning_content: string[] = []

  function defaultData(): LLMResponse {
    return { status: 100, data: { role: Role.Assistant, content: "" } }
  }
  function add(res: LLMResponse) {
    result = merge({}, result, res, {
      status: res.status === 200 ? 206 : res.status,
    })
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
  function done() {
    result = merge({}, result, { status: 200, data: { role: Role.Assistant, content: "" } })
  }
  function getTools(): LLMToolCall[] {
    return Object.values(tools)
  }
  /**
   * @description 归档当前tools,开启下一轮的tool_calls
   */
  function archiveTools() {
    const t = getTools()
    if (t.length) {
      toolsHistory.push(t)
      tools = {}
    }
  }
  function addToolCallResults(data: Message) {
    tool_calls_chain.push(data)
  }
  function getResponse(): LLMResponse {
    result.data.content = content.filter(s => !!s).join("")
    result.data.reasoning_content = reasoning_content.filter(s => !!s).join("")
    result.data.tool_calls = toolsHistory.flat().concat(getTools())
    result.data.tool_calls_chain = Array.from(tool_calls_chain)
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
    done,
    archiveTools,
    addToolCallResults,
    getTools,
    getResponse,
  }
}
export function useOpenAICompatParser() {
  const regStart = /^\s*data:\s*/
  const regKeepalive = /:\s*keep-alive/
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
            const rawText = text.replace(regStart, "")
            if (rawText.startsWith(endFlag)) {
              return {
                status: 200,
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
      console.log("[parseResponse error]", error, text)
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
