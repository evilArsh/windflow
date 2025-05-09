import { App } from "vue"
import { createHighlighter } from "shiki"
import type { InjectionKey } from "vue"

export interface Highlight {
  codeToHtml(code: string, lang: string, theme?: string): Promise<string>
}
function shikiInstance(): Highlight {
  async function codeToHtml(code: string, lang: string, theme?: string): Promise<string> {
    const highlighter = await highlighterPromise
    return highlighter.codeToHtml(code, {
      lang,
      theme: theme ?? "github-dark",
    })
  }
  return {
    codeToHtml,
  }
}
const HighlighterKey: InjectionKey<Highlight> = Symbol()
const highlighterPromise = createHighlighter({
  themes: [
    "github-dark",
    "github-light",
    "github-dark-default",
    "material-theme",
    "material-theme-darker",
    "material-theme-lighter",
    "monokai",
  ],
  langs: [
    "plaintext",
    "java",
    "javascript",
    "typescript",
    "html",
    "css",
    "json",
    "yaml",
    "markdown",
    "bash",
    "shell",
    "python",
    "php",
    "go",
    "rust",
    "c",
    "cpp",
    "java",
    "kotlin",
    "scala",
    "swift",
    "ruby",
    "perl",
    "lua",
    "sql",
    "vb",
    "csharp",
    "fsharp",
    "markdown",
    "vue",
    "vue-html",
  ],
})
export function createShiki() {
  function install(app: App): void {
    const instance = shikiInstance()
    app.provide(HighlighterKey, instance)
  }
  return {
    install,
  }
}

export function useShiki(): Highlight {
  const instance = inject(HighlighterKey)
  if (!instance) {
    throw new Error("useShiki() is called outside of a setup function")
  }
  return instance
}
