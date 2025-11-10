import { Message } from "@renderer/types"
import { RAGEmbeddingConfig } from "@shared/types/rag"
import { cloneDeep, code2xx, isString } from "@toolmain/shared"

export const useRag = () => {
  async function patch(knowledgeId: string, emConfig: RAGEmbeddingConfig, messages: Message[]): Promise<Message[]> {
    try {
      if (!messages.length) return messages
      const userMsg = messages[messages.length - 1]
      if (userMsg.role !== "user") return messages
      if (!window.api) return messages
      const content = isString(userMsg.content) ? userMsg.content : JSON.stringify(userMsg.content)
      const res = await window.api.rag.search(
        {
          content,
          topicId: knowledgeId,
        },
        cloneDeep(emConfig)
      )
      console.log("[rag search result]", res)
      const getPrompt = (content: string, extra: string) => {
        return `You are given the following extracted parts of a long document(in the <Extracted> block) and a question(in the <Question> block also known as knowledge base), Provide a conversational answer.
      If you don't know the answer, You must indicate that you did not find the answer in the Extracted knowledge base. Don't try to make up an answer.
      If the contents in the extracted parts are empty, politely inform them that you are unable to answer the question based on the provided context.
      If the question is not about the document, politely inform them that you are tuned to only answer questions that are related to the document.
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
          return {
            fileName: item.content,
            fileSize: item.fileSize,
            chunkIndex: item.chunkIndex,
            mimeType: item.mimeType,
            content: item.content,
            _distance: item._distance,
          }
        })
        userMsg.content = getPrompt(content, JSON.stringify(kb))
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
