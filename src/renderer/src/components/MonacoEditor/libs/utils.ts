import { resolvePath } from "@toolmain/shared"
import { editor, Uri } from "monaco-editor"

export function getModel(uri: Uri): editor.ITextModel | null {
  return editor.getModel(uri)
}
export function createModel(value: string, lang?: string, uri?: Uri): editor.ITextModel {
  return editor.createModel(value, lang, uri)
}
export function getOrCreateModel(uri: Uri, lang: string | undefined, value: string): editor.ITextModel {
  const model = getModel(uri)
  if (model) {
    model.setValue(value)
    return model
  }
  return createModel(value, lang, uri)
}

/**
 * 设置相对地址 `file:///foo/bar`
 */
export function uriParse(filename: string, namespace?: string): Uri {
  const _filename = resolvePath([namespace ?? "", filename])
  return Uri.parse(`file://${_filename}`)
}
