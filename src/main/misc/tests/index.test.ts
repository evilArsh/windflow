import { describe, expect, it } from "vitest"
import path from "node:path"
import fs from "node:fs"
import { getFileInfo } from "../file"
describe("file mime type", () => {
  it("test file info", async () => {
    const fileList = [
      {
        path: path.join(__dirname, "index.xml"),
        exceptMime: "application/xml",
        expectExt: "xml",
      },
      {
        path: path.join(__dirname, "index.xls"),
        exceptMime: "application/x-cfb",
        expectExt: "cfb",
      },
      {
        path: path.join(__dirname, "index.xlsx"),
        exceptMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        expectExt: "xlsx",
      },
      {
        path: path.join(__dirname, "index.doc"),
        exceptMime: "application/x-cfb",
        expectExt: "cfb",
      },
      {
        path: path.join(__dirname, "index.docx"),
        exceptMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        expectExt: "docx",
      },
      {
        path: path.join(__dirname, "index.csv"),
        exceptMime: "text/csv",
        expectExt: "csv",
      },
      {
        path: path.join(__dirname, "index"),
        expectExt: "",
        //! exceptMime: "text/plain",
        exceptMime: "",
      },
      {
        path: path.join(__dirname, "index.md"),
        exceptMime: "text/markdown",
        expectExt: "md",
      },
      {
        path: path.join(__dirname, "index.js"),
        exceptMime: "text/javascript",
        expectExt: "js",
      },
      {
        path: path.join(__dirname, "index.ts"),
        //! exceptMime: "text/plain",
        exceptMime: "video/mp2t",
        expectExt: "ts",
      },
      {
        path: path.join(__dirname, "index.txt"),
        exceptMime: "text/plain",
        expectExt: "txt",
      },
      {
        path: path.join(__dirname, "index.pdf"),
        exceptMime: "application/pdf",
        expectExt: "pdf",
      },
      {
        path: path.join(__dirname, "index.c"),
        exceptMime: "text/x-c",
        expectExt: "c",
      },
      {
        path: path.join(__dirname, "out"),
        exceptMime: "application/x-elf",
        expectExt: "elf",
      },
    ]
    for (const file of fileList) {
      if (fs.existsSync(file.path)) {
        const info = await getFileInfo(file.path)
        expect(info.mimeType).equal(file.exceptMime)
        expect(info.extension).equal(file.expectExt)
      } else {
        console.warn(file.path, " not exists")
      }
    }
  })
})
