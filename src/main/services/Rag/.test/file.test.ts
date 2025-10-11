import { describe, expect, it, vi } from "vitest"
import path from "node:path"
import fs from "node:fs"
import { RAGEmbeddingConfig, RAGLocalFileInfo, RAGLocalFileMeta } from "@shared/types/rag"
import { uniqueId } from "@toolmain/shared"
import { readFile } from "../doc"

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
    maxFileChunks: 512,
    maxInputs: 20,
    maxTokens: 512,
    dimensions: 1024,
  }

  it("read xlsx", async () => {
    const topicId = "topic-1"

    const meta: RAGLocalFileMeta = {
      id: uniqueId(),
      path: path.join(__dirname, "work.xlsx"),
      topicId,
    }
    const stat = fs.statSync(meta.path)
    const info: RAGLocalFileInfo = {
      ...meta,
      fileName: path.basename(meta.path),
      fileSize: stat.size,
    }

    const res = await readFile(info, config)
    console.log(res)
    expect(res.data.length).gte(0)
  })

  it("read csv", async () => {
    const topicId = "topic-1"

    const meta: RAGLocalFileMeta = {
      id: uniqueId(),
      path: path.join(__dirname, "work.csv"),
      topicId,
    }
    const stat = fs.statSync(meta.path)
    const info: RAGLocalFileInfo = {
      ...meta,
      fileName: path.basename(meta.path),
      fileSize: stat.size,
    }
    const res = await readFile(info, config)
    console.log(res)
    expect(res.data.length).gte(0)
  })
  it("read pdf", async () => {
    const topicId = "topic-1"

    const meta: RAGLocalFileMeta = {
      id: uniqueId(),
      path: path.join(__dirname, "test2.pdf"),
      topicId,
    }
    const stat = fs.statSync(meta.path)
    const info: RAGLocalFileInfo = {
      ...meta,
      fileName: path.basename(meta.path),
      fileSize: stat.size,
    }
    const res = await readFile(info, config)
    console.log(res)
    expect(res.data.length).gte(0)
  })
  it("read docx", async () => {
    const topicId = "topic-1"

    const meta: RAGLocalFileMeta = {
      id: uniqueId(),
      path: path.join(__dirname, "test2.doc"),
      topicId,
    }
    const stat = fs.statSync(meta.path)
    const info: RAGLocalFileInfo = {
      ...meta,
      fileName: path.basename(meta.path),
      fileSize: stat.size,
    }
    const res = await readFile(info, config)
    console.log(res)
    expect(res.data.length).gte(0)
  })
})
