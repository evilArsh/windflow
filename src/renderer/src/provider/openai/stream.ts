import { LLMResponse, Role } from "@renderer/types"
import { toNumber } from "@toolmain/shared"
import OpenAISDK from "openai"
import { Stream } from "openai/core/streaming.mjs"
import { ResponseFunctionToolCall, ResponseOutputItem } from "openai/resources/responses/responses"
import { usePartialData } from "../compatible/utils"

export async function streamParse(
  partial: ReturnType<typeof usePartialData>,
  response: Stream<OpenAISDK.Responses.ResponseStreamEvent>,
  callback: (message: LLMResponse) => void
) {
  let responseData: LLMResponse
  const tmpItems: ResponseOutputItem[] = []
  tmpItems.length = 0
  for await (const chunk of response) {
    console.log(`[${chunk.type}]`, chunk)
    switch (chunk.type) {
      case "response.output_item.added": {
        tmpItems.push(chunk.item)
        break
      }
      case "response.mcp_call_arguments.delta": {
        const callItem = tmpItems.find(item => item.type == "function_call" && item.id === chunk.item_id) as
          | ResponseFunctionToolCall
          | undefined
        if (!callItem) {
          console.warn("[openai makeRequest]", "unknown item", chunk)
          break
        }
        responseData = {
          status: 206,
          data: {
            role: "",
            tool_calls: [
              {
                function: {
                  arguments: "",
                  name: callItem.name,
                },
                type: "function",
                index: chunk.output_index,
                serverId: "",
                id: callItem.call_id,
              },
            ],
            content: "",
          },
        }
        partial.add(responseData)
        callback(partial.getResponse())
        break
      }
      case "response.function_call_arguments.done": {
        const callItem = tmpItems.find(item => item.type == "function_call" && item.id === chunk.item_id) as
          | ResponseFunctionToolCall
          | undefined
        if (!callItem) {
          console.warn("[openai makeRequest]", "unknown item", chunk)
          break
        }
        responseData = {
          status: 206,
          data: {
            role: "",
            tool_calls: [
              {
                function: {
                  arguments: chunk.arguments,
                  name: callItem.name,
                },
                type: "function",
                index: chunk.output_index,
                // will auto set in `partial` later
                serverId: "",
                id: callItem.call_id,
              },
            ],
            content: "",
          },
        }
        partial.add(responseData)
        callback(partial.getResponse())
        break
      }
      case "response.output_text.delta": {
        responseData = {
          status: 206,
          data: {
            content: chunk.delta,
            role: Role.Assistant,
          },
        }
        partial.add(responseData)
        callback(partial.getResponse())
        break
      }
      case "response.reasoning_text.delta": {
        responseData = {
          status: 206,
          data: {
            content: "",
            reasoning_content: chunk.delta,
            role: Role.Assistant,
          },
        }
        partial.add(responseData)
        callback(partial.getResponse())
        break
      }
      case "response.output_text.done": {
        break
      }
      case "response.completed": {
        responseData = {
          status: 200,
          data: {
            content: "",
            role: Role.Assistant,
            usage: {
              total_tokens: toNumber(chunk.response.usage?.total_tokens),
              prompt_tokens: toNumber(chunk.response.usage?.input_tokens),
              completion_tokens: toNumber(chunk.response.usage?.output_tokens),
            },
          },
        }
        partial.done()
        partial.add(responseData)
        callback(partial.getResponse())
        break
      }
      case "response.failed": {
        responseData = {
          status: 500,
          data: {
            content: chunk.response.error?.message ?? "request error",
            role: Role.Assistant,
          },
        }
        partial.done()
        partial.add(responseData)
        callback(partial.getResponse())
        break
      }
      default:
        break
    }
  }
}
export async function nonStreamParse(
  partial: ReturnType<typeof usePartialData>,
  response: OpenAISDK.Responses.Response,
  callback: (message: LLMResponse) => void
) {
  partial.add({
    status: 200,
    data: {
      content: "",
      role: Role.Assistant,
      usage: {
        total_tokens: toNumber(response.usage?.total_tokens),
        prompt_tokens: toNumber(response.usage?.input_tokens),
        completion_tokens: toNumber(response.usage?.output_tokens),
      },
    },
  })
  response.output.forEach((item, index) => {
    switch (item.type) {
      case "reasoning": {
        partial.add({
          status: 200,
          data: {
            content: "",
            reasoning_content: item.content?.map(item => item.text).join(""),
            role: Role.Assistant,
          },
        })
        callback(partial.getResponse())
        break
      }
      case "message": {
        partial.add({
          status: 200,
          data: {
            content: item.content.map(item => (item.type == "output_text" ? item.text : item.refusal)).join(""),
            role: Role.Assistant,
          },
        })
        callback(partial.getResponse())
        break
      }
      case "function_call": {
        partial.add({
          status: 200,
          data: {
            role: Role.Tool,
            tool_calls: [
              {
                function: {
                  arguments: item.arguments,
                  name: item.name,
                },
                type: "function",
                index, // must specify a flag for the stream mode compatible
                serverId: "",
                id: item.call_id,
              },
            ],
            content: "",
          },
        })
        callback(partial.getResponse())
        break
      }
    }
  })
}
