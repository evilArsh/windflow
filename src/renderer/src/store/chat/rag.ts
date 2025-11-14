import { Message } from "@renderer/types"
import { RAGEmbeddingConfig } from "@shared/types/rag"
import { cloneDeep, code2xx, isString } from "@toolmain/shared"

export const useRag = () => {
  async function patch(
    knowledgeId: string,
    messageId: string,
    emConfig: RAGEmbeddingConfig,
    messages: Message[]
  ): Promise<Message[]> {
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
          sessionId: messageId,
        },
        cloneDeep(emConfig)
      )
      console.log("[rag search result]", res)
      const getPrompt = (content: string, extra: string) => {
        return `You are given the following extracted parts of a long document(in the <Extracted> block,also known as knowledge base) and a question(in the <Question> block).
      Provide a conversational answer base on <Extracted> block.
      If you don't know the answer, You MUST indicate that you did not find the answer base on the Extracted parts. Don't and MUST NOT try to make up an answer.
      If the contents in the extracted parts are empty, politely inform them that you are unable to answer the question based on the provided context.
      If an answer is found, a note specifying the file name must be added below each answer.
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
