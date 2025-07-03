import type { CSSProperties } from "@renderer/lib/shared/types"
import {
  type SandboxInstance,
  setSandbox,
  type IframeCreateConf,
  type IframeScriptInject,
  type ScriptModules,
  type IframeLinkInject,
} from "./common"
import { createSandBoxComponent, defineSandBoxComponent } from "./shadow"
import { eventListenerRemove, usePatch } from "./patch"
defineSandBoxComponent()

export class SandBox implements SandboxInstance {
  private readonly id: string
  private iframe: HTMLIFrameElement | undefined
  private iframeDom: Document | undefined
  private iframeWindow: Window | undefined
  private shadowEle: HTMLElement | undefined
  private containerEle: HTMLElement | undefined
  private createConfig: IframeCreateConf | undefined
  private shadowRoot: ShadowRoot | undefined
  /**
   * shadowRoot 挂载完毕，并且属性拦截修改完毕
   */
  private mounted: boolean
  private scriptStack: IframeScriptInject[]

  private uPatch: ReturnType<typeof usePatch> | undefined

  constructor() {
    this.id = uniqueId()
    this.mounted = false
    this.scriptStack = []
  }
  private _onMounted() {
    this.mounted = true
    this.scriptStack.forEach(s => {
      this._createScript(s)
    })
    this.scriptStack = []
  }
  private _clearScriptTags() {
    this.iframeDom?.head.querySelectorAll("script[type=module]").forEach(v => {
      this.iframeDom?.head.removeChild(v)
    })
  }
  private _createScript(data: IframeScriptInject) {
    if (!this.iframeDom) {
      console.error("[error when create script]", "iframe dom not inited")
      return
    }
    const script = document.createElement("script")
    if (data.attrs) {
      for (const [k, v] of Object.entries(data.attrs)) {
        script.setAttribute(k, v)
      }
    }
    if (data.src) {
      script.setAttribute("src", data.src)
    } else if (data.textContent) {
      script.textContent = data.textContent
    }
    data.type && script.setAttribute("type", data.type)

    this.iframeDom.head.appendChild(script)
  }

  /**
   * 创建iframe元素
   */
  private async createIframe(conf?: IframeCreateConf) {
    let resolveCb: (value: void | PromiseLike<void>) => void
    const done = new Promise<void>(resolve => {
      resolveCb = resolve
    })

    this.iframe = document.createElement("iframe")
    const attrs: Record<string, string> = {
      style: "display:none",
      sandbox: [
        "allow-same-origin",
        "allow-scripts",
        // "allow-forms",
        // "allow-modals",
        // "allow-pointer-lock",
        // "allow-popups",
        // "allow-top-navigation-by-user-activation",
      ].join(" "),
      ...conf?.attrs,
    }
    for (const [k, v] of Object.entries(attrs)) {
      this.iframe.setAttribute(k, v)
    }
    this.iframe.addEventListener("load", () => resolveCb())
    window.document.body.appendChild(this.iframe)
    await done

    if (!this.iframe.contentWindow) {
      console.error("[error when init dom]", "iframe.contentWindow not exist")
      return
    }
    this.iframeWindow = this.iframe.contentWindow
    this.iframeDom = this.iframeWindow.document
    const newDom = window.document.implementation.createHTMLDocument("")
    const newDomElement = this.iframeDom.importNode(newDom.documentElement, true)
    this.iframeDom.replaceChild(newDomElement, this.iframeDom.documentElement)

    if (conf?.importMap) {
      this.createScript({
        type: "importmap",
        textContent: JSON.stringify({
          imports: conf.importMap,
        }),
      })
    }
  }

  /**
   * iframe中注入script
   */
  createScript(data: IframeScriptInject) {
    if (!this.mounted) {
      this.scriptStack.push(data)
      return
    }
    this._createScript(data)
  }

  createStyle(styles: Record<string, CSSProperties> | string): void {
    if (!this.iframeDom) {
      console.error("[error when create style]", "iframe dom not inited")
      return
    }
    const style = document.createElement("style")
    if (typeof styles === "string") {
      style.textContent = styles
    } else {
      // TODO
    }
    this.iframeDom.head.appendChild(style)
  }
  createLink(data: IframeLinkInject): void {
    if (!this.iframeDom) {
      console.error("[error when create script]", "iframe dom not inited")
      return
    }
    const link = document.createElement("link")
    link.setAttribute("rel", data.rel)
    data.href && link.setAttribute("href", data.href)
    data.hreflang && link.setAttribute("hreflang", data.hreflang)
    data.media && link.setAttribute("media", data.media)
    data.type && link.setAttribute("type", data.type)
    this.iframeDom.head.appendChild(link)
  }

  async updateImportMap(imports: Record<string, string>) {
    if (!this.containerEle) {
      console.error("[container element must be set]")
      return
    }
    if (!this.createConfig) {
      this.createConfig = {}
    }
    this.createConfig.importMap = imports
    this.shadowEle && this.containerEle.removeChild(this.shadowEle)
    await this.create(this.containerEle, this.createConfig)
  }

  async createScriptsSync(data: IframeScriptInject) {
    const done = new Promise(resolve => {
      window.__next__ = resolve
    })
    if (data.textContent) {
      data.textContent = data.textContent + "\n;window.parent.__next__()"
    } else {
      data.textContent = ";window.parent.__next__()"
    }
    this.createScript(data)
    await done
  }

  createScriptModule(m: ScriptModules) {
    this._clearScriptTags()
    m.getModules().forEach(v => {
      this.createScript({
        textContent: v,
        type: "module",
      })
    })
  }

  async createScriptModuleSync(m: ScriptModules) {
    this._clearScriptTags()
    for (const script of m.getModules()) {
      await this.createScriptsSync({
        textContent: script,
        type: "module",
      })
    }
  }

  async create(container: HTMLElement, conf?: IframeCreateConf) {
    this.destroy()
    this.createConfig = conf
    this.containerEle = container
    this.shadowEle = createSandBoxComponent(this.id)
    setSandbox(this.id, this)
    await this.createIframe(conf)
    this.containerEle.appendChild(this.shadowEle)
  }

  destroy() {
    if (this.iframe) {
      this.uPatch?.destroy()
      this.iframeWindow && eventListenerRemove(this.iframeWindow)
      window.document.body.removeChild(this.iframe)
      this.iframe = undefined
    }
  }

  /**
   * web component 挂载后调用
   */
  setShadowRoot(root: ShadowRoot) {
    this.shadowRoot = root
    const html = document.createElement("html")
    const head = document.createElement("head")
    const body = document.createElement("body")

    this.shadowRoot.appendChild(html)
    html.appendChild(head)
    html.appendChild(body)

    this.shadowRoot.html = html
    this.shadowRoot.head = head
    this.shadowRoot.body = body

    if (this.iframe && this.iframeDom && this.iframeWindow && this.containerEle) {
      this.uPatch = usePatch({
        iframe: this.iframe,
        iframeDom: this.iframeDom,
        iframeWindow: this.iframeWindow,
        shadowRoot: this.shadowRoot,
        shadowRootParent: this.containerEle,
      })
    }
    this.createStyle("*{margin:0;padding:0;box-sizing:border-box}")
    this.createStyle("html{width:100%;height:100%}")
    this.createStyle("body{width:100%;height:100%}")
    this.createStyle(`::-webkit-scrollbar {width: 8px;height: 8px;}
      ::-webkit-scrollbar-track {background: transparent;}
      ::-webkit-scrollbar-thumb {background-color: #0003;border-radius: 4px;transition: all 0.2s ease-in-out;}
      ::-webkit-scrollbar-thumb:hover {background-color: #0005;}
      ::-webkit-scrollbar-track:hover {border-radius: 4px;}`)
    this._onMounted()
  }

  getId() {
    return this.id
  }
}

export * from "./shadow"
export * from "./common"
export * from "./modules"
