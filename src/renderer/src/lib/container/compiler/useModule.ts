import type { CodeModule, BaseModule, SFCOptions } from "./types"
import { CodeFile } from "./types"
import { compile as doCompile, reCompile } from "./compile"
import { compileModuleForPreview } from "./process"

export default (cfg?: BaseModule): CodeModule => {
  let files: Record<string, CodeFile> = cfg?.files ?? {}
  let dir: string = cfg?.dir ?? "src/"
  let main: string = cfg?.main ?? "App.vue"
  let sfcOptions: SFCOptions | undefined = cfg?.sfcOptions

  function _resolve(...paths: string[]): string {
    const p = paths.join("/")
    return p.replace(/\/{1,}/g, "/")
  }
  async function setFiles(_files: Record<string, string | CodeFile>, autoCompile?: boolean): Promise<void> {
    files = {}
    for (const [k, v] of Object.entries(_files)) {
      if (typeof v === "string") {
        files[_resolve(dir, k)] = new CodeFile(_resolve(dir, k), v)
      } else {
        v.filename = _resolve(dir, v.filename)
        files[_resolve(dir, k)] = v
      }
    }
    if (autoCompile) {
      await compileAll()
    }
  }
  function setMain(mainFilename: string): void {
    main = mainFilename
  }
  function setDir(newDir: string): void {
    const _files = { ...files }
    files = {}
    for (const [k, v] of Object.entries(_files)) {
      v.filename = _resolve(newDir, v.filename.replace(dir, ""))
      files[_resolve(newDir, k.replace(dir, ""))] = v
    }
    dir = newDir
  }
  /**
   * 编译所有源代码，并返回`files`
   */
  async function compileAll(): Promise<Record<string, CodeFile>> {
    const alltasks: Array<() => Promise<CodeFile>> = []
    Object.keys(files).forEach(filename => {
      alltasks.push(async () => {
        const res = await reCompile(files[filename], sfcOptions)
        files[filename] = res
        return res
      })
    })
    await Promise.all(alltasks.map(async v => await v()))
    return files
  }
  /**
   * 编译指定的文件并返回结果
   */
  async function compile(filename: string): Promise<CodeFile | null> {
    const _fn = _resolve(dir, filename)
    const file = files[_fn]
    if (!file) return null
    const res = await doCompile(file.filename, file.code, sfcOptions)
    files[_fn] = res
    return res
  }
  /**
   * 编译为浏览器可直接运行的代码
   */
  async function compileForPreview(isSSR: boolean): Promise<string[]> {
    return await compileModuleForPreview(
      {
        files,
        main: getMain(),
        dir,
        sfcOptions,
      },
      isSSR
    )
  }
  function clearFiles(): void {}
  async function setSFCOptions(opts: SFCOptions) {
    sfcOptions = opts
    await compileAll()
  }
  function getFiles(): Record<string, CodeFile> {
    return files
  }
  function getSFCOptions(): SFCOptions | undefined {
    return sfcOptions
  }
  function getMain(): string {
    return _resolve(dir, main)
  }
  function getDir(): string {
    return dir
  }
  return {
    getFiles,
    getSFCOptions,
    getMain,
    getDir,
    setFiles,
    setMain,
    setDir,
    setSFCOptions,
    compileAll,
    compile,
    compileForPreview,
    clearFiles,
  }
}
