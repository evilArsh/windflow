import readline from "node:readline"
import fs from "node:fs"
import { RAGLocalFileProcess } from "@shared/types/rag"
import csv from "csv-parser"
import log from "electron-log"
import pdf from "pdf-parse"
import mammoth from "mammoth"
import { streamToAsyncIterator } from "./utils"
import ExcelJS from "exceljs"

export const Flags = {
  Error: Symbol("[ERROR]"),
  Done: Symbol("[DONE]"),
}

export interface DataTransformer<T = any> {
  /**
   * iteratively return a string or a symbol.
   * a symbol represents a error or a done event of the stream, both status indicate the stream is finish
   */
  next: () => AsyncGenerator<T>
  done: () => void
}

export function useReadLine(stream: fs.ReadStream): DataTransformer {
  let signal: AbortController | null = null
  let rl: readline.Interface | null = null
  function done(): void {
    signal?.abort()
    rl?.close()
    !stream.destroyed && stream.destroy()
    signal = null
    rl = null
  }
  async function* next(): AsyncGenerator<string | symbol> {
    try {
      if (stream.closed) {
        yield Flags.Done
      }
      if (!rl) {
        rl = readline.createInterface({
          input: stream,
          crlfDelay: Infinity,
        })
      }
      if (!signal) {
        signal = new AbortController()
      }
      for await (const line of rl) {
        if (signal.signal.aborted) {
          yield Flags.Done
        }
        yield line
      }
      yield Flags.Done
    } catch (_e) {
      yield Flags.Error
    }
  }

  return {
    next,
    done,
  }
}

export function useTextTransformer(meta: RAGLocalFileProcess): DataTransformer<string | symbol> {
  let stream: fs.ReadStream | null = null
  let lineTransformer: DataTransformer | null = null
  function done(): void {
    lineTransformer?.done()
    !stream?.destroyed && stream?.destroy()
  }
  async function* next(): AsyncGenerator<string | symbol> {
    try {
      if (!stream) {
        stream = fs.createReadStream(meta.path)
      }
      if (!lineTransformer) {
        lineTransformer = useReadLine(stream)
      }
      for await (const line of lineTransformer.next()) {
        yield line
      }
      yield Flags.Done
    } catch (e) {
      log.error("[useTextTransformer error]", e)
      yield Flags.Error
    }
  }
  return {
    next,
    done,
  }
}

export function useCsvTransformer(meta: RAGLocalFileProcess): DataTransformer<string | symbol> {
  let stream: fs.ReadStream | null = null
  function done(): void {
    !stream?.destroyed && stream?.destroy()
  }
  async function* next(): AsyncGenerator<any> {
    try {
      if (!stream) {
        stream = fs.createReadStream(meta.path)
      }
      for await (const line of streamToAsyncIterator(stream.pipe(csv()))) {
        // { NAME: 'Daffy Duck', AGE: '24' }
        yield JSON.stringify(line)
      }
      yield Flags.Done
    } catch (e) {
      log.error("[useCsvTransformer error]", e)
      yield Flags.Error
    }
  }
  return {
    next,
    done,
  }
}

export function usePdfTransformer(meta: RAGLocalFileProcess): DataTransformer<string | symbol> {
  function done(): void {}
  async function* next(): AsyncGenerator<any> {
    try {
      const buf = fs.readFileSync(meta.path)
      const res = await pdf(buf)
      yield res.text
      yield Flags.Done
    } catch (e) {
      log.error("[usePdfTransformer error]", e)
      yield Flags.Error
    }
  }
  return {
    next,
    done,
  }
}

export function useDocxTransformer(meta: RAGLocalFileProcess): DataTransformer<string | symbol> {
  function done(): void {}
  async function* next(): AsyncGenerator<any> {
    try {
      const res = await mammoth.extractRawText({ path: meta.path })
      yield res.value
      yield Flags.Done
    } catch (e) {
      log.error("[usePdfTransformer error]", e)
      yield Flags.Error
    }
  }
  return {
    next,
    done,
  }
}
export function useXlsxTransformer(meta: RAGLocalFileProcess): DataTransformer<string | symbol> {
  function done(): void {}
  async function* next(): AsyncGenerator<any> {
    try {
      const workbook = new ExcelJS.stream.xlsx.WorkbookReader(meta.path, {
        sharedStrings: "emit",
        hyperlinks: "emit",
        worksheets: "emit",
        styles: "ignore",
      })
      for await (const worksheetReader of workbook) {
        for await (const row of worksheetReader) {
          yield JSON.stringify(row.values)
        }
      }
      yield Flags.Done
    } catch (e) {
      log.error("[useCsvTransformer error]", e)
      yield Flags.Error
    }
  }
  return {
    next,
    done,
  }
}
