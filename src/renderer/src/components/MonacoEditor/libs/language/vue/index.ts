import * as monaco from "monaco-editor"
import { createHighlighterCore } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine-javascript.mjs"
import { shikiToMonaco } from "@shikijs/monaco"

import langVue from "shiki/langs/vue.mjs"
import langTsx from "shiki/langs/tsx.mjs"
import langJsx from "shiki/langs/jsx.mjs"
import themeDark from "shiki/themes/dark-plus.mjs"
import themeLight from "shiki/themes/light-plus.mjs"

import { vueLangConfig } from "./langConfig"
import { EditorEv } from "@renderer/components/MonacoEditor/useEditor"
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
  ev.on("mounted", () => {
    registerVueHighlighter()
  })
}
