import { RAGLocalFileMeta } from "@shared/types/rag"

export function combineUniqueId(meta: RAGLocalFileMeta) {
  return `$_${meta.topicId}_${meta.path}`
}
