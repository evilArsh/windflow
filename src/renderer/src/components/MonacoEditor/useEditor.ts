import { editor as _editor } from "monaco-editor"
import type { EditorProps } from "./types"
import { getOrCreateModel, uriParse } from "./libs/utils"
import { resolvePath } from "@renderer/lib/shared/resource"
import useEvent, { type EventBus } from "@renderer/usable/useEvent"
export interface EditorEv {
  /**
   * 当前编辑器要打开的文件列表发生改变
   */
  fileListChange: (list: string[]) => void
  mounted: () => void
  beforeUnmount: () => void
  change: (file: string) => void
}
export default () => {
  const ev: EventBus<EditorEv> = useEvent()
  let editor: _editor.IStandaloneCodeEditor | undefined
  const files: Set<string> = new Set()

  function _createModel(data: EditorProps): _editor.ITextModel {
    const model = getOrCreateModel(uriParse(data.filename, data.namespace), data.lang, data.value)
    files.add(resolvePath([data.namespace, data.filename]))
    return model
  }
  function _clearModels() {
    _editor.getModels().forEach(model => {
      if (files.has(resolvePath(model.uri.path))) {
        model.dispose()
      }
    })
  }
  // function _clearOld(_oldFilename: string, namespace: string) {
  //   const model = _editor.getModel(uriParse(_oldFilename, namespace))
  //   model && model.dispose()
  // }
  function onValueChange(data: EditorProps) {
    if (!editor) return
    if (editor.getValue() !== data.value) {
      editor.setValue(data.value)
      if (data.autoFormat) {
        editor.trigger("*", "editor.action.formatDocument", null)
        // editor?.getAction("monacoEditor.action.formatDocument")?.run()
      }
    }
  }
  function onLangChange(data: EditorProps) {
    if (!editor) return
    const model = editor.getModel()
    model && _editor.setModelLanguage(model, data.lang)
  }
  function onFilenameChange(data: EditorProps) {
    if (!editor) return
    const model = _createModel(data)
    editor.setModel(model)
    ev.emit("fileListChange", Array.from(files.values()))
  }
  function onNameSpaceChange(data: EditorProps) {
    _clearModels()
    files.clear()
    onFilenameChange(data)
  }
  async function create(el: HTMLElement, init: EditorProps): Promise<void> {
    const model = _createModel(init)
    const editorInstance = _editor.create(el, {
      model: model,
      minimap: { enabled: false }, // 预览图
      theme: "vs-dark", // 主题
      multiCursorModifier: "ctrlCmd", // 主键
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      }, // 滚动条
      scrollBeyondLastLine: false, // 取消代码后面一大段空白
      overviewRulerBorder: false, // 不要滚动条的边框
      lineNumbers: "off", // 行号
      tabSize: 2, // tab大小
      fontSize: 14, // 字体大小
      autoIndent: "advanced", // 自动调整缩进
      automaticLayout: true, // 自动布局
    })
    editor = editorInstance
    editor.onDidChangeModelContent(() => {
      ev.emit("change", editor?.getValue() ?? "")
    })
  }

  function dispose(conf: EditorProps) {
    ev.removeAllListeners()
    editor?.dispose()
    if (conf.disposeModel) {
      _clearModels()
    }
  }
  return {
    editor,
    create,
    dispose,
    ev,
    onValueChange,
    onLangChange,
    onFilenameChange,
    onNameSpaceChange,
  }
}
