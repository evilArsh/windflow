import readline from "node:readline"
import fs from "node:fs"
import csv from "csv-parser"
import { PDFParse } from "pdf-parse"
import mammoth from "mammoth"
import ExcelJS, { CellErrorValue, CellFormulaValue, CellHyperlinkValue, CellValue } from "exceljs"
import { isArray, isBoolean, isDate, isNull, isNumber, isString, isUndefined } from "@toolmain/shared"
import { Primitive } from "type-fest"
import { useLog } from "@main/hooks/useLog"
import { RAGServiceId } from ".."

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

export function useTextTransformer(path: string): DataTransformer<string | symbol> {
  let stream: fs.ReadStream | null = null
  let lineTransformer: DataTransformer | null = null
  const log = useLog(RAGServiceId)
  function done(): void {
    lineTransformer?.done()
    !stream?.destroyed && stream?.destroy()
  }
  async function* next(): AsyncGenerator<string | symbol> {
    try {
      if (!stream) {
        stream = fs.createReadStream(path)
      }
      if (!lineTransformer) {
        lineTransformer = useReadLine(stream)
      }
      for await (const line of lineTransformer.next()) {
        if (line) {
          yield line
        }
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

export function useCsvTransformer(path: string): DataTransformer<string | symbol> {
  let stream: fs.ReadStream | null = null
  const log = useLog(RAGServiceId)
  function done(): void {
    !stream?.destroyed && stream?.destroy()
  }
  async function* next(): AsyncGenerator<any> {
    try {
      if (!stream) {
        stream = fs.createReadStream(path)
      }
      for await (const line of stream.pipe(csv())) {
        // { NAME: 'Daffy Duck', AGE: '24' }
        if (line) {
          yield JSON.stringify(line)
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

export function usePdfTransformer(path: string): DataTransformer<string | symbol> {
  const log = useLog(RAGServiceId)
  function done(): void {}
  async function* next(): AsyncGenerator<any> {
    try {
      const buf = fs.readFileSync(path)
      const res = new PDFParse({ data: buf })
      const text = await res.getText()
      for (let i = 0; i < text.pages.length; i++) {
        const textArr = text.pages[i].text.split(/\r?\n/g)
        for (let j = 0; j < textArr.length; j++) {
          if (textArr[j]) {
            yield textArr[j]
          }
        }
      }
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

export function useDocxTransformer(path: string): DataTransformer<string | symbol> {
  const log = useLog(RAGServiceId)
  function done(): void {}
  async function* next(): AsyncGenerator<any> {
    try {
      const res = await mammoth.extractRawText({ path: path })
      const textArr = res.value.split(/\r?\n/g)
      for (let j = 0; j < textArr.length; j++) {
        if (textArr[j]) {
          yield textArr[j]
        }
      }
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
export function useXlsxTransformer(path: string): DataTransformer<string | symbol> {
  const log = useLog(RAGServiceId)
  function useCounter() {
    // store oldest data with specified length
    let header: ExcelJS.CellValue[] | null = null
    const data: Array<ExcelJS.CellValue[]> = []
    function add(newData: ExcelJS.CellValue[]) {
      if (!header) {
        header = newData
      } else {
        if (header.length < newData.length) {
          header = newData
        }
      }
      data.push(newData)
    }
    function clear() {
      header = null
      data.length = 0
    }
    function getData() {
      return { header, data }
    }
    return {
      clear,
      add,
      getData,
    }
  }
  function getValue(cell: CellValue): string | null {
    if (isNull(cell) || isUndefined(cell)) {
      return null
    }
    if (isString(cell) || isNumber(cell) || isBoolean(cell) || isDate(cell)) {
      return cell.toString()
    } else if (Object.hasOwn(cell, "error")) {
      return (cell as CellErrorValue).error
    } else if (Object.hasOwn(cell, "text")) {
      return (cell as CellHyperlinkValue).text
    } else if (Object.hasOwn(cell, "result")) {
      return String((cell as CellFormulaValue).result)
    }
    return null
  }
  function done(): void {}
  async function* next(): AsyncGenerator<any> {
    try {
      const workbook = new ExcelJS.stream.xlsx.WorkbookReader(path, {
        sharedStrings: "cache",
        hyperlinks: "emit",
        worksheets: "emit",
        styles: "ignore",
      })
      const counter = useCounter()
      for await (const worksheetReader of workbook) {
        counter.clear()
        for await (const row of worksheetReader) {
          if (isArray(row.values)) {
            counter.add(row.values)
          }
        }
        const { header, data } = counter.getData()
        for (let i = 0; i < data.length; i++) {
          const result: Record<string, Primitive> = {}
          for (let j = 0; j < data[i].length; j++) {
            const row = getValue(data[i][j])
            const headerTitle = header && header.length >= data[i].length ? getValue(header[j]) : null
            if (headerTitle) {
              result[headerTitle] = row
            }
          }
          if (Object.keys(result).length) {
            yield JSON.stringify(result)
          }
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
