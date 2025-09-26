import { describe, expect, it } from "vitest"
import path from "node:path"
import { RAGServiceImpl } from ".."
import { uniqueId } from "@toolmain/shared"
import { EventBusImpl } from "@main/services/EventBus"

describe("main/src/Rag", () => {
  const bus = new EventBusImpl()
  const rag = new RAGServiceImpl(bus)
  it("test handle file", async () => {
    await rag.processLocalFile(
      {
        id: uniqueId(),
        path: path.join(__dirname, "test.md"),
      },
      {
        id: "embedding-1",
        embedding: {
          providerName: "SiliconFlow",
          model: "Qwen/Qwen3-Embedding-8B",
          api: "https://api.siliconflow.cn/v1",
          apiKey: "",
        },
        maxFileChunks: 512,
        maxInputs: 20,
        maxTokens: 512,
        dimensions: 1024,
      }
    )
  })
})
