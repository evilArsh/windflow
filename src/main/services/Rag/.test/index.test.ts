import { describe, expect, it, vi } from "vitest"
import path from "node:path"
import { RAGServiceImpl } from ".."
import { uniqueId } from "@toolmain/shared"
import { EventBusImpl } from "@main/services/EventBus"
import { EventKey, RAGFileProcessStatusEvent } from "@shared/types/eventbus"
import { RAGEmbeddingConfig, RAGFile, RAGFileStatus, RAGLocalFileMeta } from "@shared/types/rag"
import { VectorStore } from "../db"
import { combineTableName, createTableSchema } from "../db/utils"

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

  const config: RAGEmbeddingConfig = {
    id: "embedding-1",
    name: "test",
    embedding: {
      providerName: "SiliconFlow",
      model: "Qwen/Qwen3-Embedding-8B",
      api: "https://api.siliconflow.cn/v1/embeddings",
      apiKey: "",
    },
    rerank: {
      providerName: "SiliconFlow",
      model: "Qwen/Qwen3-Reranker-8B",
      api: "https://api.siliconflow.cn/v1/rerank",
      apiKey: "",
    },
    maxFileChunks: 512,
    maxInputs: 20,
    maxTokens: 512,
    dimensions: 1024,
  }

  it("clear table data", async () => {
    const db = new VectorStore({
      rootDir: path.join(__dirname),
    })
    await db.open()
    const topicId = "test_topic_clear_table"
    const tableName = combineTableName(topicId)

    const DataRows = 256

    if (await db.hasTable(tableName)) {
      await db.deleteTable(tableName)
    }

    await db.createEmptyTable(tableName, createTableSchema(128))

    const data: RAGFile[] = []
    for (let i = 0; i < DataRows; i++) {
      data.push({
        id: `test_id: ${i}`,
        topicId: topicId,
        fileId: `file_id: ${i}`,
        fileName: `file_name: ${i}`,
        fileSize: i,
        chunkIndex: i,
        content: `content: ${i}`,
        vector: Array.from({ length: 128 }, () => Math.random()),
        configId: "do_not_need_config_id",
      })
    }
    await db.insert(tableName, data)

    const res = await db.clearTable(tableName)
    const count = await db.countRows(tableName)
    expect(res).toBe(DataRows)
    expect(count).equal(0)

    db.close()
  })
  it("insert vector data", async () => {
    const db = new VectorStore({
      rootDir: path.join(__dirname),
    })
    await db.open()
    const topicId = "test_insert_data_topic"
    const tableName = combineTableName(topicId)
    if (!(await db.hasTable(tableName))) {
      await db.createEmptyTable(tableName, createTableSchema(128))
    }
    const DataRows = 256

    await db.clearTable(tableName)
    expect(await db.countRows(tableName)).equal(0)

    const data: RAGFile[] = []
    for (let i = 0; i < DataRows; i++) {
      data.push({
        id: `test_id: ${i}`,
        topicId: topicId,
        fileId: `file_id: ${i}`,
        fileName: `file_name: ${i}`,
        fileSize: i,
        chunkIndex: i,
        content: `content: ${i}`,
        vector: Array.from({ length: 128 }, () => Math.random()),
        configId: "do_not_need_config_id",
      })
    }
    await db.insert(tableName, data)

    expect(await db.countRows(tableName)).equal(DataRows)

    data.length = 0

    for (let i = 0; i < DataRows; i++) {
      data.push({
        id: `test_id: ${i}`,
        topicId: topicId,
        fileId: `file_id: ${i}`,
        fileName: `file_name: ${i}`,
        fileSize: i,
        chunkIndex: i,
        content: `content: ${i}`,
        vector: Array.from({ length: 128 }, () => Math.random()),
        configId: "do_not_need_config_id",
      })
    }
    await db.upsert(tableName, data)

    expect(await db.countRows(tableName)).equal(DataRows)

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

    const topicId = "test_topic_rag"

    const meta: RAGLocalFileMeta = {
      id: uniqueId(),
      path: path.join(__dirname, "work.xlsx"),
      topicId: topicId,
    }

    await rag.processLocalFile(meta, config)
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

  it("search RAG file", async () => {
    const topicId = "test_topic_rag"
    const bus = new EventBusImpl()
    const rag = new RAGServiceImpl(bus, {
      store: {
        rootDir: path.join(__dirname),
      },
    })

    const sRes = await rag.search(
      {
        content: "吴小龙出勤天数",
        topicId: topicId,
      },
      config
    )
    console.log(sRes)
    expect(sRes.data.length).gt(0)
    expect(sRes.code).equal(200)
  }, 20000)
})
