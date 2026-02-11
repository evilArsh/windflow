import { cloneDeep, isArrayLength } from "@toolmain/shared"
import { LLMConfig, LLMToolCallRequest, Message, ModelMeta } from "@windflow/core/types"

const enableThinkingWhiteList = [
  "Pro/zai-org/GLM-4.7",
  "deepseek-ai/DeepSeek-V3.2",
  "Pro/deepseek-ai/DeepSeek-V3.2",
  "zai-org/GLM-4.6",
  "Qwen/Qwen3-8B",
  "Qwen/Qwen3-14B",
  "Qwen/Qwen3-32B",
  "Qwen/Qwen3-30B-A3B",
  "tencent/Hunyuan-A13B-Instruct",
  "zai-org/GLM-4.5V",
  "deepseek-ai/DeepSeek-V3.1-Terminus",
  "Pro/deepseek-ai/DeepSeek-V3.1-Terminus",
]
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
  // https://docs.siliconflow.cn/cn/api-reference/chat-completions/chat-completions
  if (!enableThinkingWhiteList.includes(modelMeta.modelName)) {
    data.enable_thinking = !!originalParams?.reasoning
  }
  if (isArrayLength(toolList)) {
    data.tools = toolList
  }
  return data
}
