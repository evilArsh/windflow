import type { AsyncComponnet, IterableRoute, Router, RouterMeta } from "./types"
export default class Node {
  private path: string
  private component?: AsyncComponnet
  private redirect?: string
  private readonly children: Node[]
  private readonly meta: RouterMeta
  constructor(path: string) {
    this.path = path
    this.children = []
    this.meta = {
      title: this.path,
      path: this.path,
      fullPath: "", // 动态拼接
    }
  }

  static create(path: string): Node {
    return new Node(path)
  }

  setComponent(component: AsyncComponnet | undefined): this {
    this.component = component
    return this
  }

  getComponent(): AsyncComponnet | undefined {
    return this.component
  }

  pushChild(node: Node): this {
    this.children.push(node)
    return this
  }

  getChild(): Node[] {
    return this.children
  }

  getPath(): string {
    return this.path
  }

  setPath(path: string): this {
    this.path = path
    return this
  }

  setRedirect(path: string | undefined): void {
    this.redirect = path
  }

  getRedirect(): string | undefined {
    return this.redirect
  }

  updateMeta(meta: Partial<RouterMeta>): void {
    Object.assign(this.meta, meta)
  }

  getMeta(): RouterMeta {
    return this.meta
  }

  generate<T extends IterableRoute<T>>(router: Router, callback: (node: Router) => T): T {
    const dst: T = callback(router)
    if (router.children && router.children.length > 0) {
      dst.children = router.children.map(v => this.generate(v, callback))
    } else {
      dst.children = undefined
    }
    return dst
  }

  generateRouter(): Router {
    return {
      path: this.path,
      meta: this.getMeta(),
      redirect: this.redirect,
      component: this.component,
      children: this.children.map(v => v.generateRouter()),
    }
  }
}
