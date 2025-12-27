import { useLog } from "@main/hooks/useLog"
import { RAGEmbeddingConfig } from "@windflow/shared"
import { cloneDeep } from "@toolmain/shared"

export const RAGServiceId = "RAGService"
export const log = useLog(RAGServiceId)

export function encapEmbeddinConfig(config: RAGEmbeddingConfig): RAGEmbeddingConfig {
  return Object.assign(cloneDeep(config), {
    embedding: {
      ...config.embedding,
      apiKey: new Array(config.embedding.apiKey?.length ?? 0).fill("*").join(""),
    },
    rerank: config.rerank
      ? {
          ...config.rerank,
          apiKey: new Array(config.rerank.apiKey?.length ?? 0).fill("*").join(""),
        }
      : undefined,
  })
}
