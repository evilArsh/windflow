import { App } from "vue"
import { createHighlighter } from "shiki"
import type { InjectionKey } from "vue"
import type { Root } from "hast"

export interface Highlight {
  codeToHtml(code: string, lang: string, theme?: string): Promise<string>
  codeToAst(code: string, lang: string, theme?: string): Promise<Root>
}
function langPatch(lang: string): string {
  switch (lang) {
    case "wat":
      return "wasm"
    case "nasm":
      return "asm"
    default:
      return lang
  }
}
function shikiInstance(): Highlight {
  async function codeToHtml(code: string, lang: string, theme?: string): Promise<string> {
    try {
      const highlighter = await highlighterPromise
      return highlighter.codeToHtml(code, {
        lang: langPatch(lang),
        theme: theme ?? "github-dark",
      })
    } catch (_e) {
      return code
    }
  }
  async function codeToAst(code: string, lang: string, theme?: string): Promise<Root> {
    try {
      const highlighter = await highlighterPromise
      return highlighter.codeToHast(code, {
        lang: langPatch(lang),
        theme: theme ?? "github-dark",
      })
    } catch (_e) {
      return {
        type: "root",
        children: [
          {
            type: "element",
            tagName: "div",
            properties: {},
            children: [],
          },
        ],
      }
    }
  }
  return {
    codeToHtml,
    codeToAst,
  }
}
const HighlighterKey: InjectionKey<Highlight> = Symbol("useShiki")
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
    "wasm",
    "asm",
    "mermaid",
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
    onBeforeUnmount(async () => {
      const hl = await highlighterPromise
      hl.dispose()
    })
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
