import * as monaco from "monaco-editor"
import * as volar from "@volar/monaco"
import { getOrCreateModel } from "../../utils"
import { WorkerLanguageService } from "@volar/monaco/worker"
// import type { LanguageService } from "@vue/language-service"
export interface WorkerMessage {
  event: "init"
  tsVersion: string
  tsLocale?: string
}
export class WorkerHost {
  onFetchCdnFile(uri: string, text: string) {
    getOrCreateModel(monaco.Uri.parse(uri), undefined, text)
  }
}
let disposeVue: undefined | (() => void)
export const tsconfig = {
  compilerOptions: {
    allowJs: true,
    checkJs: true,
    jsx: "Preserve",
    target: "ESNext",
    module: "ESNext",
    moduleResolution: "Bundler",
    allowImportingTsExtensions: true,
  },
  vueCompilerOptions: {
    target: 3.4,
  },
}
export async function reloadVueLanguageTools(fileList: monaco.Uri[]) {
  disposeVue?.()
  // let dependencies: Record<string, string> = {}
  // dependencies = {
  //   ...dependencies,
  //   vue: "3.4.20",
  //   "@vue/compiler-core": "3.4.20",
  //   "@vue/compiler-dom": "3.4.20",
  //   "@vue/compiler-sfc": "3.4.20",
  //   "@vue/compiler-ssr": "3.4.20",
  //   "@vue/reactivity": "3.4.20",
  //   "@vue/runtime-core": "3.4.20",
  //   "@vue/runtime-dom": "3.4.20",
  //   "@vue/shared": "3.4.20",
  // }
  // dependencies = {
  //   ...dependencies,
  //   typescript: "5.4.5",
  // }
  const worker = monaco.editor.createWebWorker<WorkerLanguageService>({
    moduleId: "vs/language/vue/vueWorker",
    label: "vue",
    host: new WorkerHost(),
    createData: {
      tsconfig,
      dependencies: {} as Record<string, string>,
    },
  })
  const languageId = ["vue", "javascript", "typescript"]
  const getSyncUris = () => fileList
  const { dispose: disposeMarkers } = volar.activateMarkers(worker, languageId, "vue", getSyncUris, monaco.editor)
  const { dispose: disposeAutoInsertion } = volar.activateAutoInsertion(worker, languageId, getSyncUris, monaco.editor)
  const { dispose: disposeProvides } = await volar.registerProviders(worker, languageId, getSyncUris, monaco.languages)

  monaco.editor.registerEditorOpener({
    openCodeEditor(_, resource) {
      if (resource.toString().startsWith("file:///node_modules")) {
        return true
      }

      const path = resource.path
      if (/^\//.test(path)) {
        // const fileName = path.replace("/", "")
        // if (fileName !== store.activeFile.filename) {
        // store.setActive(fileName)
        return true
        // }
      }

      return false
    },
  })
  disposeVue = () => {
    disposeMarkers()
    disposeAutoInsertion()
    disposeProvides()
    worker?.dispose()
  }
}
