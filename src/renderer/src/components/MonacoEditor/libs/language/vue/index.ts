import * as monaco from "monaco-editor"
import { createHighlighterCore } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine-javascript.mjs"
import { shikiToMonaco } from "@shikijs/monaco"
import VueWorker from "./index.worker.ts?worker"
import { type WorkerMessage } from "./env"

import langVue from "shiki/langs/vue.mjs"
import langTsx from "shiki/langs/tsx.mjs"
import langJsx from "shiki/langs/jsx.mjs"
import themeDark from "shiki/themes/dark-plus.mjs"
import themeLight from "shiki/themes/light-plus.mjs"

import { reloadVueLanguageTools } from "./env"
import { vueLangConfig } from "./langConfig"
import { EditorEv } from "@renderer/components/MonacoEditor/useEditor"
import { uriParse } from "../../utils"
import { EventBus } from "@toolmain/shared"

async function registerVueHighlighter() {
  const highlighter = await createHighlighterCore({
    themes: [themeDark, themeLight],
    langs: [langVue, langTsx, langJsx],
    engine: createJavaScriptRegexEngine(),
  })
  shikiToMonaco(highlighter, monaco)
  return {
    light: themeLight.name!,
    dark: themeDark.name!,
  }
}

export function registerLang(ev: EventBus<EditorEv>) {
  monaco.languages.register({ id: "vue", extensions: [".vue"] })
  monaco.languages.setLanguageConfiguration("vue", vueLangConfig)
  monaco.languages.onLanguage("vue", () => {
    reloadVueLanguageTools([])
  })
  ev.on("fileListChange", (val: string[]) => {
    reloadVueLanguageTools(val.map(v => uriParse(v)))
  })
  ev.on("mounted", () => {
    registerVueHighlighter()
  })
}
export async function getWorker() {
  const worker = new VueWorker()
  const init = new Promise<void>(resolve => {
    worker.addEventListener("message", data => {
      if (data.data === "inited") {
        resolve()
      }
    })
    worker.postMessage({
      event: "init",
      tsVersion: "5.4.5",
      tsLocale: "",
    } satisfies WorkerMessage)
  })
  await init
  return worker
}
