import { RAGEmbeddingConfig } from "@shared/types/rag"

export type Knowledge = {
  id: string
  name: string
  /**
   * specify embedding config id when in `rag` type
   */
  embeddingId?: string
  /**
   * knowledge implementation type, current `rag` only
   */
  type: "rag"
}

export type KnowledgeEmbeddingPair = {
  knowledgeId: string
  embeddingConfig: RAGEmbeddingConfig
}
