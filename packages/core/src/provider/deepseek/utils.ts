import { cloneDeep, isArrayLength } from "@toolmain/shared"
import { formatContentString } from "@windflow/core/message"
import { LLMConfig, LLMToolCallRequest, Message, ModelMeta, RequestHandler } from "@windflow/core/types"

export function useHandler(): RequestHandler {
  return {
    getSignal: () => new AbortController().signal,
    setController: _ => {},
    terminate: () => {},
  }
}

export function deepSeekLLMParamsHandler(
  context: Message[],
  modelMeta: ModelMeta,
  toolList: LLMToolCallRequest[],
  originalParams?: LLMConfig
): Record<string, any> {
  const messages = cloneDeep(context)
  messages.forEach(m => (m.content = formatContentString(m.content)))
  const data: Record<string, any> = {
    stream: true,
    ...originalParams,
    model: modelMeta.modelName,
    messages,
    n: 1,
    response_format: { type: "text" },
  }
  data.thinking = {
    type: originalParams?.reasoning ? "enabled" : "disabled",
  }
  if (isArrayLength(toolList)) {
    data.tools = toolList
  }
  return data
}
