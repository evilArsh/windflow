import { describe, expect, it, vi } from "vitest"
import path from "node:path"
import { RAGServiceImpl } from ".."
import { uniqueId } from "@toolmain/shared"
import { EventBusImpl } from "@main/services/EventBus"
import { EventKey, RAGFileProcessStatusEvent } from "@shared/types/eventbus"
import { RAGFileStatus, RAGLocalFileMeta } from "@shared/types/rag"
import { initDB, LanceStore } from "../db"

describe("main/src/Rag", () => {
  vi.mock("electron", () => ({
    app: {
      getPath: (_: string) => {
        return path.join(__dirname)
      },
    },
  }))

  vi.mock("electron-log", () => {
    const lgMock = {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      verbose: console.debug,
    }
    return {
      default: { ...lgMock, scope: (_: string) => lgMock },
    }
  })
  it("open lance store", async () => {
    const db = new LanceStore({
      rootDir: path.join(__dirname),
    })
    await db.open()
    await initDB(db)
    expect(db.isOpen()).toBe(true)
    db.close()
  })
  it("process RAG file", async () => {
    const bus = new EventBusImpl()
    const rag = new RAGServiceImpl(bus, {
      store: {
        rootDir: path.join(__dirname),
      },
    })

    let res: RAGFileProcessStatusEvent | undefined
    const eventCallback = vi.fn(data => {
      res = data
    })
    bus.on(EventKey.RAGFileProcessStatus, eventCallback)

    const meta: RAGLocalFileMeta = {
      id: uniqueId(),
      path: path.join(__dirname, "test.md"),
    }
    await rag.processLocalFile(meta, {
      id: "embedding-1",
      embedding: {
        providerName: "SiliconFlow",
        model: "Qwen/Qwen3-Embedding-8B",
        api: "https://api.siliconflow.cn/v1/embeddings",
        apiKey: "",
      },
      maxFileChunks: 512,
      maxInputs: 20,
      maxTokens: 512,
      dimensions: 1024,
    })
    await vi.waitFor(
      () => {
        expect(res?.status).toBe(RAGFileStatus.Finish)
      },
      {
        timeout: 30000,
        interval: 1500,
      }
    )

    expect(res).toBeTruthy()
    expect(res?.path).equal(meta.path)
    expect(res?.id).equal(meta.id)
    expect(res?.status).equal(RAGFileStatus.Finish)
  }, 60000)
})
