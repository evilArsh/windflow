import * as monaco from "monaco-editor"
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
import CssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker"
import HtmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker"
import TsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker"
import * as vueWorker from "./language/vue/index"
import CSSDicts from "./dicts/cssstyle"
import { EditorEv } from "../useEditor"
import { EventBus } from "@toolmain/shared"

let inited = false

export async function initEnv(ev: EventBus<EditorEv>) {
  if (inited) return // await onigasm.loadWASM(onigasmWasm)
  ;(self as any).MonacoEnvironment = {
    async getWorker(_: string, label: string) {
      if (label === "json") {
        return new JsonWorker()
      }
      if (label === "css" || label === "scss" || label === "less") {
        return new CssWorker()
      }
      if (label === "html" || label === "handlebars" || label === "razor") {
        return new HtmlWorker()
      }
      if (["typescript", "javascript"].includes(label)) {
        return new TsWorker()
      }
      // @@@@@@@@ todo:plugin
      // @@@@@@@@
      return new EditorWorker()
    },
  }
  monaco.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,
  })
  monaco.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.typescript.ScriptTarget.ESNext,
    allowNonTsExtensions: true,
  })

  monaco.json.jsonDefaults.setDiagnosticsOptions({
    allowComments: true,
  })

  // 加入css 提示
  monaco.languages.registerCompletionItemProvider("json", {
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }
      return {
        suggestions: CSSDicts.map(v => {
          return {
            label: v.label,
            kind: monaco.languages.CompletionItemKind.Property,
            insertText: v.insertText,
            detail: v.detail,
            range,
          }
        }),
      }
    },
  })

  // @@@@@@@@ todo:plugin
  vueWorker.registerLang(ev)
  // @@@@@@@@
  inited = true
}
