import { ModelMeta } from "@windflow/core/types"

export function isOSeries(model: ModelMeta): boolean {
  return /^\d*o\d*/.test(model.modelName)
}
export function isGPTOSeries(model: ModelMeta): boolean {
  return /^gpt-\d*o/.test(model.modelName)
}
export function isGPTSeries(model: ModelMeta): boolean {
  return /^gpt-/.test(model.modelName)
}
export function modelVersion(model: ModelMeta): number {
  if (isGPTOSeries(model)) {
    return parseFloat(model.modelName.replace(/^gpt-/, ""))
  }
  if (isOSeries(model)) {
    return parseFloat(model.modelName.replace(/^o/, ""))
  }
  if (isGPTSeries(model)) {
    return parseFloat(model.modelName.replace(/^gpt-/, ""))
  }
  return 0
}
/**
 * gpt-5.1 defaults to none, which does not perform reasoning. The supported reasoning values for gpt-5.1 are none, low, medium, and high. Tool calls are supported for all reasoning values in gpt-5.1.
 * All models before gpt-5.1 default to medium reasoning effort, and do not support none.
 *
 * FIXME: fix when model version greater than gpt-5*
 */
export function supportReasoning(model: ModelMeta): boolean {
  // https://developers.openai.com/api/docs/models
  // Models used in ChatGPT, not recommended for API use.
  // gpt-5-chat-latest，chatgpt-4o-latest
  if (model.modelName === "gpt-5-chat-latest" || model.modelName === "chatgpt-4o-latest") {
    return false
  }
  if (isGPTOSeries(model)) {
    return modelVersion(model) >= 5
  }
  if (isOSeries(model)) {
    return true
  }
  if (isGPTSeries(model)) {
    return modelVersion(model) >= 5
  }
  return false
}

export function modelVersionGt5(model: ModelMeta): boolean {
  return modelVersion(model) > 5
}
