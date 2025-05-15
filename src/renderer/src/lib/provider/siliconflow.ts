import { ProviderMeta, ModelMeta, ModelType, ModelsResponse } from "@renderer/types"
import { OpenAICompatible } from "./openai"
import { patchInstance } from "./utils"

const types = [
  { name: "chat", type: ModelType.Chat },
  { name: "embedding", type: ModelType.Embedding },
  { name: "reranker", type: ModelType.Reranker },
  { name: "text-to-image", type: ModelType.TextToImage },
  { name: "image-to-image", type: ModelType.ImageToImage },
  { name: "speech-to-text", type: ModelType.SpeechToText },
  { name: "text-to-video", type: ModelType.TextToVideo },
]
// const reasonerPattern = /deepseek-r1|qwq-32b|deepseek-reasoner|qwen3/

export class SiliconFlow extends OpenAICompatible {
  constructor() {
    super()
  }
  async fetchModels(provider: ProviderMeta): Promise<ModelMeta[]> {
    const res: ModelMeta[][] = []
    patchInstance(provider, this.axios)
    const req = types.reduce(
      (acc, v) => {
        acc.push(
          this.axios
            .request<ModelsResponse>({
              method: provider.apiModelList.method,
              url: provider.apiModelList.url,
              params: { sub_type: v.name },
            })
            .then(res => ({
              type: v.type,
              data: res.data.data,
            }))
        )
        return acc
      },
      [] as Promise<{ type: ModelType; data: ModelsResponse["data"] }>[]
    )
    const dataRes = await Promise.all(req)

    dataRes.forEach(items => {
      res.push(
        items.data.map(v => ({
          id: `${provider.name}_${v.id}`,
          type: items.type,
          // items.type === ModelType.Chat
          //   ? reasonerPattern.test(v.id.toLowerCase())
          //     ? ModelType.ChatReasoner
          //     : ModelType.Chat
          //   : items.type,
          modelName: v.id,
          providerName: provider.name,
          subProviderName: v.id.indexOf("/") > 0 ? v.id.slice(0, v.id.indexOf("/")) : provider.name,
        }))
      )
    })
    return res.flat()
  }
}
