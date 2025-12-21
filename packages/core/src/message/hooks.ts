import { cloneDeep, code2xx, isArrayLength, isString, isUndefined } from "@toolmain/shared"
import {
  ChatTopic,
  ModelMeta,
  ProviderMeta,
  ChatMessage,
  BeforeRequestCallback,
  BeforeRequestParams,
  Message,
  KnowledgeEmbeddingPair,
} from "@windflow/core/types"
import { storage } from "@windflow/core/storage"

/**
 * the hook is triggered when the 100 status code message is send before do llm request
 */
export function beforeLLMRequest(topic: ChatTopic, message: ChatMessage): BeforeRequestCallback {
  const patchRag = async (
    pairs: KnowledgeEmbeddingPair[],
    messageId: string,
    messages: Message[]
  ): Promise<Message[]> => {
    try {
      if (!messages.length) return messages
      const userMsg = messages[messages.length - 1]
      if (userMsg.role !== "user") return messages
      if (!window.api) return messages
      const content = isString(userMsg.content) ? userMsg.content : JSON.stringify(userMsg.content)
      const res = await window.api.rag.search({
        content,
        sessionId: messageId,
        configs: cloneDeep(pairs.map(pair => ({ topicId: pair.knowledgeId, config: pair.embeddingConfig }))),
      })
      console.log("[rag search result]", res)
      const getPrompt = (content: string, extra: string) => {
        return `You are given the following extracted parts of a long document(in the <Extracted> block,also known as knowledge base) and a question(in the <Question> block).
      Summarize answer base on <Extracted> block.
      If you don't know the answer or the extracted parts are empty, You MUST indicate that you did not find the answer base on the Extracted parts. DO NOT and MUST NOT try to make up an answer.
      If you find the answer, you must explicitly indicate the source of the answer by marking the referenced file name on a separate line under each answer.
      <Question>
      ${content}
      </Question>
      <Extracted>
      ${extra}
      </Extracted>`
      }
      if (!code2xx(res.code) || !res.data.length) {
        userMsg.content = getPrompt(content, "")
      } else {
        const kb = res.data.map(item => {
          return `{fileName:${item.fileName},content:${item.content}}`
        })
        userMsg.content = getPrompt(content, kb.join("\n"))
      }
      return messages
    } catch (error) {
      console.error("[rag patch error]", error)
      return messages
    }
  }

  const getEmbeddingConfigByIds = async (knowledgeIds: string[]): Promise<KnowledgeEmbeddingPair[]> => {
    const availableKbs = (await storage.knowledge.gets(knowledgeIds))
      .filter(v => !isUndefined(v))
      .filter(kb => !isUndefined(kb.embeddingId))
    const emConfigs = await storage.embedding.gets(availableKbs.map(kb => kb.embeddingId).filter(s => !isUndefined(s)))
    if (knowledgeIds.length !== emConfigs.length) {
      console.warn("[getEmbeddingConfigByIds] mismatch length bwetween knowledgeIds and embeddingConfigs")
    }
    return availableKbs
      .map(kb => {
        const embeddingConfig = emConfigs.find(em => em?.id === kb.embeddingId)
        return !isUndefined(embeddingConfig)
          ? {
              knowledgeId: kb.id,
              embeddingConfig,
            }
          : undefined
      })
      .filter(r => !isUndefined(r))
  }

  return async (messages: Message[], model: ModelMeta, provider: ProviderMeta): Promise<BeforeRequestParams> => {
    let m = messages
    // rag service
    if (isArrayLength(topic.knowledgeId)) {
      const pairs = await getEmbeddingConfigByIds(topic.knowledgeId)
      m = await patchRag(pairs, message.id, messages)
    }
    const llmConfig = await storage.chat.getChatLLMConfig(topic.id)
    // mcp service
    const mcpServersIds = (await window.api.mcp.getTopicServers(topic.id)).data
    return {
      messages: m,
      model,
      provider,
      reqConfig: llmConfig,
      mcpServersIds,
    }
  }
}
