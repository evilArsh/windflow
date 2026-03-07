import { RAGLocalFileMeta } from "@windai/shared"

export function combineUniqueId(meta: RAGLocalFileMeta) {
  return `$_${meta.topicId}_${meta.path}`
}
