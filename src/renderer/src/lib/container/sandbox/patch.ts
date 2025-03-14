import type { CallBackFn } from "@renderer/lib/shared/types"

export type PatchBox = {
  iframe: HTMLIFrameElement
  iframeDom: Document
  iframeWindow: Window
  shadowRoot: ShadowRoot
  shadowRootParent: HTMLElement
}

const useResizeObserver = () => {
  const cb: CallBackFn[] = []
  let running = false
  let target: Element | undefined
  const ob = new ResizeObserver(_entries => {
    cb.forEach(v => {
      setTimeout(() => {
        v()
      }, 0)
    })
  })
  const hdl = {
    // value: ob,
    observe: (_target?: Element) => {
      if (running) return
      if (_target) target = _target
      if (target) {
        ob.observe(target)
        running = true
      }
    },
    disconnect: (): void => {
      running = false
      ob.disconnect()
    },
    unobserve: (): void => {
      if (!running) return
      target && ob.unobserve(target)
      running = false
    },
    setCallBack: (callback: CallBackFn) => {
      hdl.observe()
      cb.push(callback)
    },
    delCallBack: (callback: CallBackFn) => {
      const i = cb.findIndex(val => val === callback)
      if (i >= 0) {
        cb.splice(i, 1)
      }
      if (cb.length == 0) {
        hdl.unobserve()
      }
    },
  }
  return hdl
}
function patchIframeDocument(box: PatchBox) {
  Object.defineProperties(box.shadowRoot.body, {
    ownerDocument: {
      configurable: true,
      get: () => box.iframeDom,
    },
  })
  Object.defineProperties(box.iframeDom, {
    activeElement: { get: () => box.shadowRoot.activeElement },
    adoptedStyleSheets: {
      get: () => box.shadowRoot.adoptedStyleSheets,
      set: v => (box.shadowRoot.adoptedStyleSheets = v),
    },
    body: { get: () => box.shadowRoot.body },
    characterSet: { get: () => document.characterSet },
    childElementCount: { get: () => box.shadowRoot.childElementCount },
    children: { get: () => box.shadowRoot.children },
    compatMode: { get: () => document.compatMode },
    contentType: { get: () => document.contentType },
    cookie: {
      get: () => document.cookie,
      set: (v: string) => (document.cookie = v),
    },
    // currentScript
    // defaultView
    // designMode
    designMode: { get: () => document.designMode },
    dir: { get: () => document.dir },
    doctype: { get: () => document.doctype },
    documentElement: { get: () => box.shadowRoot.html },
    documentURI: { get: () => document.documentURI },
    embeds: { get: () => box.shadowRoot.body.querySelectorAll("embed") },
    firstElementChild: { get: () => box.shadowRoot.firstElementChild },
    fonts: { get: () => document.fonts },
    forms: { get: () => box.shadowRoot.body.querySelectorAll("form") },
    fullscreenElement: { get: () => box.shadowRoot.fullscreenElement },
    fullscreenEnabled: { get: () => document.fullscreenEnabled }, // TODO
    hidden: { get: () => document.hidden },
    images: { get: () => box.shadowRoot.body.querySelectorAll("img") },
    implementation: { get: () => document.implementation }, // TODO
    lastElementChild: { get: () => box.shadowRoot.lastElementChild },
    lastModified: { get: () => document.lastModified },
    links: { get: () => box.shadowRoot.querySelectorAll("a,area") },
    // location: { get: () => document.location }, // TODO,rewrite
    pictureInPictureElement: { get: () => box.shadowRoot.pictureInPictureElement },
    pictureInPictureEnabled: { get: () => document.pictureInPictureElement },
    plugins: { get: () => box.shadowRoot.body.querySelectorAll("embed") },
    pointerLockElement: { get: () => box.shadowRoot.pointerLockElement },
    // readyState: { get: () => box.shadowRoot.pointerLockElement }, // TODO,test
    referrer: { get: () => document.referrer },
    styleSheets: { get: () => box.shadowRoot.styleSheets },
    timeline: { get: () => document.timeline }, // TODO,test
    title: {
      get: () => document.title,
      set: v => (document.title = v),
    },
    URL: { get: () => document.URL },
    visibilityState: { get: () => document.visibilityState },
  })
  box.iframeDom.getElementById = (eleId: string) => box.shadowRoot.getElementById(eleId)
  // TODO: 类型转换问题
  box.iframeDom.getElementsByClassName = (classNames: string): HTMLCollectionOf<Element> => {
    return (box.shadowRoot.querySelectorAll(classNames) ?? Array.from([])) as unknown as HTMLCollectionOf<Element>
  }
  box.iframeDom.getElementsByName = (elementName: string) => box.shadowRoot.querySelectorAll(elementName)
  // TODO: 类型转换问题
  box.iframeDom.getElementsByTagName = (qualifiedName: string): HTMLCollectionOf<Element> => {
    return (box.shadowRoot.querySelectorAll(qualifiedName) ?? Array.from([])) as unknown as HTMLCollectionOf<Element>
  }
  box.iframeDom.querySelector = (selectors: string) => box.shadowRoot.querySelector(selectors)
  box.iframeDom.querySelectorAll = (selectors: string) => box.shadowRoot.querySelectorAll(selectors)
  box.iframeDom.append = (...nodes: (Node | string)[]) => {
    box.shadowRoot.body.append(...nodes)
  }
  box.iframeDom.appendChild = <T extends Node>(node: T): T => {
    return box.shadowRoot.body.appendChild(node)
  }
  box.iframeDom.prepend = (...nodes: (Node | string)[]) => {
    box.shadowRoot.body.prepend(...nodes)
  }
  box.iframeDom.replaceChildren = (...nodes: (Node | string)[]) => {
    box.shadowRoot.body.replaceChildren(...nodes)
  }
  box.iframeDom.elementFromPoint = (x: number, y: number): Element | null => {
    return box.shadowRoot.elementFromPoint(x, y)
  }
  box.iframeDom.elementsFromPoint = (x: number, y: number): Element[] => {
    return box.shadowRoot.elementsFromPoint(x, y)
  }
  box.iframeDom.cloneNode = (deep?: boolean): Node => {
    return box.shadowRoot.cloneNode(deep)
  }
  box.iframeDom.compareDocumentPosition = (other: Node): number => {
    return box.shadowRoot.compareDocumentPosition(other)
  }
  box.iframeDom.contains = (other: Node | null): boolean => {
    return box.shadowRoot.contains(other)
  }
  box.iframeDom.getRootNode = (options?: GetRootNodeOptions): Node => {
    return box.shadowRoot.getRootNode(options)
  }
  box.iframeDom.hasChildNodes = () => {
    return box.shadowRoot.hasChildNodes()
  }
  box.iframeDom.insertBefore = <T extends Node>(node: T, child: Node | null): T => {
    return box.shadowRoot.body.insertBefore(node, child)
  }
  // box.iframeDom.isDefaultNamespace
  // box.iframeDom.isEqualNode
  // box.iframeDom.isSameNode
  box.iframeDom.lookupNamespaceURI = (prefix: string | null): string | null => {
    return box.shadowRoot.lookupNamespaceURI(prefix)
  }
  box.iframeDom.lookupPrefix = (namespace: string | null): string | null => {
    return box.shadowRoot.lookupPrefix(namespace)
  }
  box.iframeDom.normalize = () => {
    return box.shadowRoot.normalize()
  }
  box.iframeDom.removeChild = <T extends Node>(child: T): T => {
    return box.shadowRoot.body.removeChild(child)
  }
  box.iframeDom.replaceChild = <T extends Node>(node: Node, child: T): T => {
    return box.shadowRoot.replaceChild(node, child)
  }
  box.iframeDom.addEventListener = <K extends keyof DocumentEventMap>(
    type: K,
    listener: (ev: DocumentEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void => {
    _eventListenerAdd(box.iframeWindow, "doc", type, listener)
    document.addEventListener(type, listener, options)
  }
  box.iframeDom.removeEventListener = <K extends keyof DocumentEventMap>(
    type: K,
    listener: (this: Document, ev: DocumentEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void => {
    _eventListenerRemove(box.iframeWindow, "doc", type, listener, options)
  }
}
function patchIframeDocumentHead(box: PatchBox) {
  box.iframeDom.head.insertBefore = <T extends Node>(node: T, child: Node | null): T => {
    const nodeName = node.nodeName.toLowerCase()
    switch (nodeName) {
      case "style":
        HTMLElement.prototype.insertBefore.call(box.shadowRoot.head, node, child)
        break
      case "script":
      default:
        box.iframeDom.head && HTMLElement.prototype.insertBefore.call(box.iframeDom.head, node, child)
        break
    }
    return node
  }
  box.iframeDom.head.appendChild = <T extends Node>(node: T): T => {
    const nodeName = node.nodeName.toLowerCase()
    switch (nodeName) {
      case "style":
      case "link":
        HTMLElement.prototype.appendChild.call(box.shadowRoot.head, node)
        break
      case "script":
      default:
        box.iframeDom.head && HTMLElement.prototype.appendChild.call(box.iframeDom.head, node)
        break
    }
    return node
  }
  box.iframeDom.head.removeChild = <T extends Node>(child: T): T => {
    const nodeName = child.nodeName.toLowerCase()
    switch (nodeName) {
      case "style":
        HTMLElement.prototype.removeChild.call(box.shadowRoot.head, child)
        break
      case "script":
      default:
        box.iframeDom.head && HTMLElement.prototype.removeChild.call(box.iframeDom.head, child)
        break
    }
    return child
  }
  box.iframeDom.head.insertAdjacentHTML = (position: InsertPosition, text: string): void => {
    // TODO: 详细的判断
    const isScript = /^<script .*/.test(text)
    if (isScript) {
      box.iframeDom.head && HTMLElement.prototype.insertAdjacentHTML.call(box.iframeDom.head, position, text)
    } else {
      HTMLElement.prototype.insertAdjacentHTML.call(box.shadowRoot.head, position, text)
    }
  }
}
function patchIframeWindow(box: PatchBox, useOb: ReturnType<typeof useResizeObserver>) {
  Object.defineProperties(box.iframeWindow, {
    // caches
    // closed // TODO opener open()
    console: { get: () => window.console },
    crossOriginIsolated: { get: () => window.crossOriginIsolated },
    crypto: { get: () => window.crypto },
    customElements: { get: () => window.customElements },
    devicePixelRatio: { get: () => window.devicePixelRatio },
    // document
    frameElement: { get: () => window.frameElement },
    frames: { get: () => window.frames },
    // history: { get: () => window.history }, // TODO: for micro-frontend feature
    innerHeight: { get: () => window.innerHeight },
    innerWidth: { get: () => window.innerWidth },
    isSecureContext: { get: () => window.isSecureContext },
    length: { get: () => window.length },
    // localStorage
    // location
    locationbar: { get: () => window.locationbar },
    menubar: { get: () => window.menubar },
    name: { get: () => window.name, set: (v: string) => (window.name = v) }, // TODO: test
    navigator: { get: () => window.navigator }, // TODO: test
    opener: { get: () => window.opener }, //TODO: test
    origin: { get: () => window.origin },
    outerHeight: { get: () => window.outerHeight },
    outerWidth: { get: () => window.outerWidth },
    // parent // TODO: test
    // performance
    personalbar: { get: () => window.personalbar },
    // scheduler
    screen: { get: () => window.screen },
    screenLeft: { get: () => window.screenLeft },
    screenTop: { get: () => window.screenTop },
    screenX: { get: () => window.screenX },
    screenY: { get: () => window.screenY },
    scrollbars: { get: () => window.scrollbars },
    scrollX: { get: () => window.scrollX },
    scrollY: { get: () => window.scrollY },
    speechSynthesis: { get: () => window.speechSynthesis },
    statusbar: { get: () => window.statusbar },
    toolbar: { get: () => window.toolbar },
    // top
    // trustedTypes
    visualViewport: { get: () => window.visualViewport },
  })
  box.iframeWindow.alert = (message?: any): void => {
    window.alert(message)
  }

  box.iframeWindow.confirm = (message?: string): boolean => {
    return window.confirm(message)
  }
  box.iframeWindow.focus = () => {
    return window.focus()
  }
  // box.iframeWindow.getComputedStyle = () => {
  //   return window.getComputedStyle()
  // }
  // box.iframeWindow. getSelection = () => {
  //   return window. getSelection()
  // }
  box.iframeWindow.matchMedia = (query: string) => {
    return window.matchMedia(query)
  }
  box.iframeWindow.moveBy = (x: number, y: number) => {
    window.moveBy(x, y)
  }
  box.iframeWindow.moveTo = (x: number, y: number) => {
    window.moveTo(x, y)
  }
  box.iframeWindow.open = (url?: string | URL, target?: string, features?: string): WindowProxy | null => {
    return window.open(url, target, features)
  }
  // postMessage
  box.iframeWindow.prompt = (message?: string, _default?: string): string | null => {
    return window.prompt(message, _default)
  }
  // print
  box.iframeWindow.resizeBy = (x: number, y: number) => {
    return window.resizeBy(x, y)
  }
  box.iframeWindow.resizeTo = (width: number, height: number) => {
    window.resizeTo(width, height)
  }
  box.iframeWindow.scroll = (...args: any[]) => {
    window.scroll(...args)
  }
  box.iframeWindow.scrollBy = (...args: any[]) => {
    window.scrollBy(...args)
  }
  box.iframeWindow.scrollTo = (...args: any[]) => {
    window.scrollTo(...args)
  }

  // TODO more function
  box.iframeWindow.addEventListener = <K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void => {
    if (type == "resize") {
      useOb.setCallBack(listener)
    }
    _eventListenerAdd(box.iframeWindow, "win", type, listener)
    window.addEventListener(type, listener, options)
  }
  box.iframeWindow.removeEventListener = <K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void => {
    if (type == "resize") {
      useOb.delCallBack(listener)
    }
    _eventListenerRemove(box.iframeWindow, "win", type, listener, options)
  }
}
function _eventListenerAdd(win: Window, ls: "doc" | "win", type: string, listener: any) {
  // console.log("[_eventListenerAdd]", win.__event_listener, ls, type)
  if (!win.__event_listener) {
    win.__event_listener = { doc: {}, win: {} }
  }
  switch (ls) {
    case "doc":
      if (!win.__event_listener.doc[type]) {
        win.__event_listener.doc[type] = []
      }
      win.__event_listener.doc[type].push(listener)
      break
    case "win":
      if (!win.__event_listener.win[type]) {
        win.__event_listener.win[type] = []
      }
      win.__event_listener.win[type].push(listener)
      break
  }
}
function _eventListenerRemove(
  win: Window,
  ls: "doc" | "win",
  type: string,
  listener: any,
  options?: boolean | EventListenerOptions
) {
  const tar = ls === "doc" ? document : window
  tar.removeEventListener(type, listener, options)
  if (!win.__event_listener) {
    return
  }
  const record = ls === "doc" ? win.__event_listener.doc : win.__event_listener.win
  if (!record[type]) {
    return
  }
  const i = record[type].findIndex(val => val === listener)
  if (i > -1) {
    const del = record[type].splice(i, 1)
    console.log("[event delete]", ls, type, del)
  }
}
/**
 * 移除所有监听
 */
export function eventListenerRemove(win: Window) {
  // console.log("[eventListenerRemove]", win.__event_listener)
  if (!win.__event_listener) {
    return
  }
  for (const [k, v] of Object.entries(win.__event_listener.doc)) {
    v.forEach(func => {
      document.removeEventListener(k, func)
    })
  }
  for (const [k, v] of Object.entries(win.__event_listener.win)) {
    v.forEach(func => {
      win.removeEventListener(k, func)
    })
  }
  win.__event_listener.doc = {}
  win.__event_listener.win = {}
}
export function usePatch(box: PatchBox) {
  const useOb = useResizeObserver()
  useOb.observe(box.shadowRootParent)

  patchIframeDocument(box)
  patchIframeDocumentHead(box)
  patchIframeWindow(box, useOb)
  return {
    destroy: () => {
      useOb.disconnect()
    },
  }
}
