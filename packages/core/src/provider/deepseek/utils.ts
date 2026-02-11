import { cloneDeep, isArrayLength, isUndefined } from "@toolmain/shared"
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
  const data: Record<string, any> = {
    stream: true,
    ...originalParams,
    model: modelMeta.modelName,
    messages: cloneDeep(context),
    n: 1,
    response_format: { type: "text" },
  }
  if (!isUndefined(originalParams?.reasoning)) {
    data.thinking = {
      type: originalParams.reasoning ? "enabled" : "disabled",
    }
  }
  if (isArrayLength(toolList)) {
    data.tools = toolList
  }
  return data
}
