import type { CSSProperties } from "@/lib/shared/types"

// --- type start
export type FuncType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any
/**
 * Sandbox Instance
 */
export interface SandboxInstance {
  setShadowRoot(root: ShadowRoot): void
  create(container: HTMLElement, conf?: IframeCreateConf): Promise<void>
  /**
   * 容器内创建脚本并执行
   */
  createScript(data: IframeScriptInject): void
  createStyle(styles: Record<string, CSSProperties> | string): void
  createLink(data: IframeLinkInject): void
  /**
   * 容器内创建脚本并等待执行完毕
   */
  createScriptsSync(data: IframeScriptInject): Promise<void>
  /**
   * 容器内创建type="module"脚本并执行
   */
  createScriptModule(m: ScriptModules): void
  /**
   * 容器内创建type="module"脚本并顺序执行
   */
  createScriptModuleSync(m: ScriptModules): Promise<void>
  /**
   * destroy iframe and invoke `create` again
   */
  updateImportMap(imports: Record<string, string>): Promise<void>
  getId(): string
  destroy(): void
}
export type LinkRel =
  | "alternate"
  | "archives"
  | "author"
  | "bookmark"
  | "external"
  | "first"
  | "help"
  | "icon"
  | "last"
  | "license"
  | "next"
  | "nofollow"
  | "noreferrer"
  | "pingback"
  | "prefetch"
  | "prev"
  | "search"
  | "sidebar"
  | "stylesheet"
  | "tag"
  | "up"
export interface IframeCreateConf {
  attrs?: { [key: string]: string }
  importMap?: Record<string, string>
  prepend?: string[]
}
export interface IframeScriptInject {
  src?: string
  type?: string
  textContent?: string
  attrs?: Record<string, string>
}
export interface IframeLinkInject {
  rel: LinkRel
  href?: string
  hreflang?: string
  media?: string
  type?: string
}

export interface ScriptModules {
  addModules(codes: string | string[]): void
  clearModules(): void
  getModules(): string[]
  /**
   * module 未被初始化前的加载页面
   */
  setInitHTML(html: string): void
  setMain(mainFilename: string): void
}

// --- type end

// --- constant start
export const CUSTOM_COMPONENT_NAME = "ce-sandbox" // 自定义web component 组件名字
export const CUSTOM_COMPONENT_ATTR_ID = `${CUSTOM_COMPONENT_NAME}-id`
// --- constant end

// ---global vars start
export const globalSandboxMap = new Map<string, SandboxInstance>()
export const getSandbox = (id: string) => globalSandboxMap.get(id)
export const setSandbox = (id: string, val: SandboxInstance) => globalSandboxMap.set(id, val)
export const delSandbox = (id: string) => globalSandboxMap.delete(id)
// ---global vars end
