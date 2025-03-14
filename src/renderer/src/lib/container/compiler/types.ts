import type { SFCAsyncStyleCompileOptions, SFCScriptCompileOptions, SFCTemplateCompileOptions } from "vue/compiler-sfc"

export interface SFCOptions {
  script?: Partial<SFCScriptCompileOptions>
  style?: Partial<SFCAsyncStyleCompileOptions>
  template?: Partial<SFCTemplateCompileOptions>
}
export class CodeFile {
  public compiled = {
    js: "",
    css: "",
    ssr: "",
  }

  public error: string[] = []

  constructor(
    public filename: string,
    public code: string
  ) {}

  get language(): string {
    if (this.filename.endsWith(".vue")) {
      return "vue"
    }
    if (this.filename.endsWith(".html")) {
      return "html"
    }
    if (this.filename.endsWith(".css")) {
      return "css"
    }
    if (this.filename.endsWith(".ts")) {
      return "typescript"
    }
    return "javascript"
  }
}

export interface BaseModule {
  /**
   * 所有文件集合
   */
  files: Record<string, CodeFile>
  /**
   * 入口文件名
   *
   * 默认 App.vue
   */
  main: string
  /**
   * 当前Module虚拟文件路径前缀
   *
   * 默认 src/
   */
  dir: string
  sfcOptions?: SFCOptions
}

/**
 * 一个独立的代码模块
 */
export interface CodeModule {
  /**
   * 替换全部files,可选择是否自动重新`compileAll`。会重建files路径
   */
  setFiles(files: Record<string, string | CodeFile>, autoCompile?: boolean): Promise<void>
  /**
   * 设置vue-sfc 编译选项，会触发`compileAll`
   */
  setSFCOptions(sfcOptions: SFCOptions): Promise<void>
  setMain(mainFilename: string): void
  /**
   * 设置Module路径前缀。会重建files路径
   * eg: /src
   */
  setDir(dir: string): void
  getFiles(): Record<string, CodeFile>
  getSFCOptions(): SFCOptions | undefined
  getMain(): string
  getDir(): string
  /**
   * 编译所有源代码，并返回`files`,当 `CodeFile`中`error` 长度大于0，说明编译失败
   */
  compileAll(): Promise<Record<string, CodeFile>>
  /**
   * 编译指定的文件并返回结果，当 `CodeFile`中`error` 长度大于0，说明编译失败
   */
  compile(filename: string): Promise<CodeFile | null>
  /**
   * 编译为浏览器可直接运行的代码
   */
  compileForPreview(isSSR: boolean): Promise<string[]>
  clearFiles(): void
}
