import { ModelMeta, ModelType } from "@windflow/core/types"

/**
 * model 只有 modelType 一种类型
 */
export function is(model: ModelMeta, modelType: ModelType): boolean {
  return model.type.every(val => val === modelType)
}
/**
 * 模型拥有 modelType 类型
 */
export function has(model: ModelMeta, modelType: ModelType): boolean {
  return model.type.includes(modelType)
}
/**
 * 是否是LLM聊天类型
 */
export function isChatType(model: ModelMeta): boolean {
  return has(model, ModelType.Chat)
}
/**
 * 是否包含
 * `ModelType.TextToImage`
 * `ModelType.ImageToImage`
 * `ModelType.ImageToText`
 */
export function isImageType(model: ModelMeta): boolean {
  return has(model, ModelType.TextToImage) || has(model, ModelType.ImageToImage) || has(model, ModelType.ImageToText)
}
/**
 * 是否包含`ModelType.TextToVideo`
 */
export function isVideoType(model: ModelMeta): boolean {
  return has(model, ModelType.TextToVideo)
}
/**
 * tts
 */
export function isTTSType(model: ModelMeta): boolean {
  return has(model, ModelType.TextToSpeech)
}
/**
 * asr
 *
 */
export function isASRType(model: ModelMeta): boolean {
  return has(model, ModelType.SpeechToText)
}
export function isRerankerType(model: ModelMeta): boolean {
  return has(model, ModelType.Reranker)
}
export function isEmbeddingType(model: ModelMeta): boolean {
  return has(model, ModelType.Embedding)
}
