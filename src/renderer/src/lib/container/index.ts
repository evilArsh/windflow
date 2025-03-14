declare global {
  interface Window {
    module: any
    __global: Record<string, any>
    __next__: (value: unknown) => unknown
    __event_listener: Record<"doc" | "win", Record<string, any[]>>
  }
  interface ShadowRoot {
    html: HTMLHtmlElement
    head: HTMLHeadElement
    body: HTMLBodyElement
  }
}
export * from "./compiler"
export * from "./sandbox"
