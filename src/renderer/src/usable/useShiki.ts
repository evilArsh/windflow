import { App } from "vue"
import { BundledHighlighterOptions, BundledLanguage, BundledTheme, createHighlighter } from "shiki"
import type { InjectionKey } from "vue"
import type { Root } from "hast"

export interface Highlight {
  codeToHtml(code: string, lang: string, theme?: string): Promise<string>
  codeToAst(code: string, lang: string, theme?: string): Promise<Root>
}
const langs: BundledHighlighterOptions<BundledLanguage, BundledTheme>["langs"] = [
  "powershell",
  "ps",
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
  "vue",
  "vue-html",
  "sass",
  "scss",
  "less",
  "jsx",
  "tsx",
  "svelte",
  "dockerfile",
  "toml",
  "ini",
  "diff",
  "regex",
  "xml",
]
const langAlias: BundledHighlighterOptions<BundledLanguage, BundledTheme>["langAlias"] = {
  wat: "wasm",
  nasm: "asm",
  "c++": "cpp",
  cxx: "cpp",
  unocss: "css",
}
const hasLang = (lang: string) => langs.includes(lang) || Object.hasOwn(langAlias, lang)
function shikiInstance(): Highlight {
  async function codeToHtml(code: string, lang: string, theme?: string): Promise<string> {
    try {
      const highlighter = await highlighterPromise
      return highlighter.codeToHtml(code, {
        lang: hasLang(lang) ? lang : "plaintext",
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
        lang: hasLang(lang) ? lang : "plaintext",
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
  langs,
  langAlias,
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
