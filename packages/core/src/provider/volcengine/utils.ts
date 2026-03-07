import { cloneDeep, isArrayLength, isUndefined } from "@toolmain/shared"
import { formatContentString } from "@windai/core/message"
import { LLMConfig, LLMToolCallRequest, Message, ModelMeta, RequestHandler } from "@windai/core/types"

export function useHandler(): RequestHandler {
  return {
    getSignal: () => new AbortController().signal,
    setController: _ => {},
    terminate: () => {},
  }
}

export function volcengineLLMParamsHandler(
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
  // FIXME: not test yet
  if (!isUndefined(originalParams?.reasoning)) {
    data.thinking = {
      type: originalParams.reasoning ? "enabled" : "disabled",
    }
  } else {
    data.thinking = {
      type: "auto",
    }
  }
  if (isArrayLength(toolList)) {
    data.tools = toolList
  }
  return data
}
