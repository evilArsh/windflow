import { ModelMeta, ModelType } from "@renderer/types"

export const useUtils = () => {
  /**
   * @description model 只有 modelType 一种类型
   */
  function is(model: ModelMeta, modelType: ModelType): boolean {
    return model.type.every(val => val === modelType)
  }
  /**
   * @description 模型拥有 modelType 类型
   */
  function has(model: ModelMeta, modelType: ModelType): boolean {
    return model.type.includes(modelType)
  }
  /**
   * @description 是否是LLM聊天类型
   */
  function isChatType(model: ModelMeta): boolean {
    return has(model, ModelType.Chat) || has(model, ModelType.ChatReasoner)
  }
  function isChatReasonerType(model: ModelMeta): boolean {
    return has(model, ModelType.ChatReasoner)
  }
  /**
   * @description 是否包含
   * `ModelType.TextToImage`
   * `ModelType.ImageToImage`
   * `ModelType.ImageToText`
   */
  function isImageType(model: ModelMeta): boolean {
    return has(model, ModelType.TextToImage) || has(model, ModelType.ImageToImage) || has(model, ModelType.ImageToText)
  }
  /**
   * @description 是否包含`ModelType.TextToVideo`
   */
  function isVideoType(model: ModelMeta): boolean {
    return has(model, ModelType.TextToVideo)
  }
  /**
   * @description tts
   */
  function isTTSType(model: ModelMeta): boolean {
    return has(model, ModelType.TextToSpeech)
  }
  /**
   * @description asr
   *
   */
  function isASRType(model: ModelMeta): boolean {
    return has(model, ModelType.SpeechToText)
  }
  function isRerankerType(model: ModelMeta): boolean {
    return has(model, ModelType.Reranker)
  }
  function isEmbeddingType(model: ModelMeta): boolean {
    return has(model, ModelType.Embedding)
  }
  return {
    is,
    has,
    isChatType,
    isChatReasonerType,
    isImageType,
    isVideoType,
    isTTSType,
    isASRType,
    isRerankerType,
    isEmbeddingType,
  }
}
