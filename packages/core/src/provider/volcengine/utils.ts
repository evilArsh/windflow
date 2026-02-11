import { cloneDeep, isArrayLength, isUndefined } from "@toolmain/shared"
import { LLMConfig, LLMToolCallRequest, Message, ModelMeta, RequestHandler } from "@windflow/core/types"

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
  const data: Record<string, any> = {
    stream: true,
    ...originalParams,
    model: modelMeta.modelName,
    messages: cloneDeep(context),
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
