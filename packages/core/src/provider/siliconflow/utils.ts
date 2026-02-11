import { cloneDeep, isArrayLength } from "@toolmain/shared"
import { LLMConfig, LLMToolCallRequest, Message, ModelMeta } from "@windflow/core/types"

export function siliconflowLLMParamsHandler(
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
  data.enable_thinking = !!originalParams?.reasoning
  if (isArrayLength(toolList)) {
    data.tools = toolList
  }
  return data
}
