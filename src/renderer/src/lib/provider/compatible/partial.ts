import { LLMToolCall, LLMChatResponse } from "@renderer/types"

export function usePartialData() {
  let result: LLMChatResponse | undefined
  let tools: Record<number, LLMToolCall> = {}

  const mergeContent = (data: LLMChatResponse) => {
    if (!result) return data
    if (isString(data.content) && isString(result.content)) {
      result.content += data.content
    } else {
      console.warn("[mergeContent] content is not string")
    }
  }
  function clear() {
    tools = {}
    // result.content = ""
    // result.usage = undefined
    // result.finish_reason = undefined
    // result.tool_calls = undefined
  }
  function add(data: LLMChatResponse) {
    if (!result) result = data
    // 分片消息每次返回的消息都是完整的数据结构,只是同一个字段的字符串是分批返回的
    // if (isString(data.content)) {
    //   result.content += data.content
    // } else {
    //   console.warn("[PartialToolCalls] content is not string", data.content)
    // }

    Object.assign(result, data, mergeContent(data))
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
    // if (data.usage) {
    //   result.usage = data.usage
    // }
    // result.finish_reason = data.finish_reason
  }
  function getTools(): LLMToolCall[] {
    return Object.values(tools)
  }
  // /**
  //  * @description 返回结果是一个完整的消息结构,包含tool_calls列表和消息内容，
  //  * 是LLM的一次响应
  //  * @returns LLMChatResponse
  //  */
  // function getResponse(): LLMChatResponse {
  //   return {
  //     ...result,
  //     tool_calls: Object.values(tools),
  //     tool_calls_chain: true,
  //     status: 206,
  //   }
  // }
  // /**
  //  * @description 返回的工具列表消息用作下次带上工具响应结果请求的上下文
  //  */
  // function getChatMessage(): LLMChatMessage {
  //   return {
  //     role: result.role,
  //     content: result.content,
  //     tool_calls: Object.values(tools),
  //   } as LLMChatMessage
  // }
  return {
    clear,
    add,
    getTools,
    // getResponse,
    // getChatMessage,
  }
}
