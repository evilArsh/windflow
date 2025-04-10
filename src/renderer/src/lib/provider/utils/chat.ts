import { LLMChatResponse, LLMChatMessage, ChatCompletionResponseStream } from "@renderer/types"
import { HttpStatusCode } from "axios"
import JSON5 from "json5"

export function parseOpenAIResponseStream(text: string): LLMChatResponse {
  try {
    const data: ChatCompletionResponseStream[] = text
      .replace(/data: |\[DONE\]|: keep-alive/g, "")
      .split("\n")
      .filter(item => !!item)
      .map(item => JSON5.parse(item))
    return {
      status: HttpStatusCode.PartialContent,
      msg: "",
      data: data.map<LLMChatMessage>(v => ({
        role: "assistant",
        content: v.choices[0].delta.content ?? "",
        reasoningContent: v.choices[0].delta.reasoning_content ?? "",
      })),
    }
  } catch (error) {
    return {
      status: HttpStatusCode.PartialContent,
      msg: "",
      data: [{ content: dataToText(error), role: "assistant" }],
    }
  }
}

export function getChatRequest() {}
