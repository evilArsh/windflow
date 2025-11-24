import { code2xx, errorToText, msg, CallBackFn, isArrayLength } from "@toolmain/shared"

export async function chooseFile(): Promise<string> {
  if (window.api) {
    const res = await window.api.file.chooseFilePath()
    if (code2xx(res.code) && isArrayLength(res.data)) {
      return res.data[0]
    }
    throw new Error(res.msg)
  }
  throw new Error(errorToText(new Error("api not found")))
  // throw new Error(t("window.api.notFound"))
}

export async function onFileChoose(done: CallBackFn, callback?: CallBackFn) {
  try {
    const absFile = await chooseFile()
    if (absFile) {
      callback?.(absFile)
    }
  } catch (error) {
    msg({ code: 500, msg: errorToText(error) })
  } finally {
    done()
  }
}
