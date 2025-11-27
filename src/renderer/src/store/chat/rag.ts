import { Message } from "@renderer/types"
import { KnowledgeEmbeddingPair } from "@renderer/types/knowledge"
import { cloneDeep, code2xx, isString } from "@toolmain/shared"

export const useRag = () => {
  async function patch(pairs: KnowledgeEmbeddingPair[], messageId: string, messages: Message[]): Promise<Message[]> {
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
  return {
    patch,
  }
}
