import { ProviderMeta, ModelMeta, ModelType, ModelsResponse } from "@renderer/types"
import { Compatible } from "./compatible"
import { patchAxios } from "./compatible/utils"
import { BridgeResponse } from "@shared/types/bridge"

const types = [
  { name: "chat", type: ModelType.Chat },
  { name: "embedding", type: ModelType.Embedding },
  { name: "reranker", type: ModelType.Reranker },
  { name: "text-to-image", type: ModelType.TextToImage },
  { name: "image-to-image", type: ModelType.ImageToImage },
  { name: "image-to-text", type: ModelType.ImageToText },
  { name: "speech-to-text", type: ModelType.SpeechToText },
  { name: "text-to-speech", type: ModelType.TextToSpeech },
  { name: "text-to-video", type: ModelType.TextToVideo },
]
// const reasonerPattern = /deepseek-r1|qwq-32b|deepseek-reasoner|qwen3/

export class SiliconFlow extends Compatible {
  constructor() {
    super()
  }
  name(): string {
    return "siliconflow"
  }
  async textToImage(_text: string, _modelMeta: ModelMeta, _provider: ProviderMeta): Promise<BridgeResponse<string>> {
    return { code: 404, msg: "not supported", data: "" }
  }
  async fetchModels(provider: ProviderMeta): Promise<ModelMeta[]> {
    patchAxios(provider, this.axios)
    const req = types.reduce(
      (acc, v) => {
        acc.push(
          this.axios
            .request<ModelsResponse>({
              method: provider.api.models?.method,
              url: provider.api.models?.url,
              params: { sub_type: v.name },
            })
            .then(res => ({
              type: v.type,
              data: res.data.data ?? [],
            }))
        )
        return acc
      },
      [] as Promise<{ type: ModelType; data: ModelsResponse["data"] }>[]
    )
    const dataRes = await Promise.all(req)
    const datas: Map<string, ModelMeta> = new Map()
    for (let i = 0; i < dataRes.length; i++) {
      for (let j = 0; j < dataRes[i].data.length; j++) {
        const item = dataRes[i].data[j]
        if (datas.has(item.id)) {
          datas.get(item.id)!.type.push(dataRes[i].type)
        } else {
          datas.set(item.id, {
            id: `${provider.name}_${item.id}`,
            type: [dataRes[i].type],
            modelName: item.id,
            providerName: provider.name,
            subProviderName: item.id.indexOf("/") > 0 ? item.id.slice(0, item.id.indexOf("/")) : provider.name,
          })
        }
      }
    }
    return Array.from(datas.values())
  }
}
