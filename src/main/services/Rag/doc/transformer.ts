import readline from "node:readline"
import fs from "node:fs"
import csv from "csv-parser"
import { PDFParse } from "pdf-parse"
import mammoth from "mammoth"
import ExcelJS, { CellErrorValue, CellFormulaValue, CellHyperlinkValue, CellValue } from "exceljs"
import { isArray, isBoolean, isDate, isNull, isNumber, isString, isUndefined } from "@toolmain/shared"
import { Primitive } from "type-fest"
import { log } from "../utils"
import { isMaxTokensReached, useString } from "./utils"

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
  function done(): void {
    lineTransformer?.done()
    !stream?.destroyed && stream?.destroy()
  }
  async function* next(): AsyncGenerator<string | symbol> {
    try {
      if (!stream) {
        stream = fs.createReadStream(path, {
          encoding: "utf8",
        })
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
  function done(): void {
    !stream?.destroyed && stream?.destroy()
  }
  async function* next(): AsyncGenerator<any> {
    try {
      if (!stream) {
        stream = fs.createReadStream(path, {
          encoding: "utf8",
        })
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
  function done(): void {}
  async function* next(): AsyncGenerator<any> {
    const parser = new PDFParse({
      url: path,
    })
    try {
      const text = await parser.getText()
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
    } finally {
      await parser.destroy()
    }
  }
  return {
    next,
    done,
  }
}

export function useDocxTransformer(path: string): DataTransformer<string | symbol> {
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
      log.error("[useDocxTransformer error]", e)
      yield Flags.Error
    }
  }
  return {
    next,
    done,
  }
}
export type XlsxTransformConfig = {
  maxTokens: number
}
export function useXlsxTransformer(path: string): DataTransformer<string | symbol> {
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
      const res = cell.toString()
      return res || null
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
        for (let row = 0; row < data.length; row++) {
          const result: Record<string, Primitive> = {}
          for (let column = 0; column < data[row].length; column++) {
            const cellData = getValue(data[row][column])
            const headerTitle = header && header.length >= data[row].length ? getValue(header[column]) : null
            if (headerTitle) {
              result[headerTitle] = cellData
            }
          }
          const res = JSON.stringify(result)
          res && (yield res)
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

export function useXlsxTransformer2(path: string, config: XlsxTransformConfig): DataTransformer<string | symbol> {
  const gStr = useString()
  function useCounter() {
    let header: ExcelJS.CellValue[] | null = null
    const data: Array<ExcelJS.CellValue[]> = []
    function add(newData: ExcelJS.CellValue[]) {
      if (!header || newData.length > header.length) {
        header = newData
        data.length = 0
      } else {
        data.push(newData)
      }
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
        gStr.clear()
        counter.clear()
        for await (const row of worksheetReader) {
          if (isArray(row.values)) {
            counter.add(row.values)
          }
        }
        const { header, data } = counter.getData()
        const headerStr = header?.map(h => getValue(h)).join() ?? ""
        let line = ""
        gStr.append(headerStr)
        for (let i = 0; i < data.length; i++) {
          line = data[i].map(h => getValue(h)).join()
          line && gStr.append(line)
          if (isMaxTokensReached(gStr.toString(), config.maxTokens)) {
            const last = gStr.popLast()
            const str = gStr.toString("\n")
            gStr.clear()
            gStr.append(headerStr)
            last && gStr.append(last)
            yield str
          }
        }
        if (!isMaxTokensReached(gStr.toString(), config.maxTokens)) {
          const str = gStr.toString("\n")
          gStr.clear()
          yield str
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
