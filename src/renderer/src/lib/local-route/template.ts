import type { AsyncComponnet, IterableRoute, ResolveConfig, Router, RouterTreeConfig } from "./types"
import * as vars from "./variable"
import { resolvePath } from "@renderer/lib/shared/resource"
import Node from "./node"

export class RouterTree {
  readonly root: Node
  private routes: Map<string, Node | null | undefined>
  private readonly __PREFIX__ = "__PREFIX__"
  private readonly config: RouterTreeConfig
  private readonly cache: Map<string, Node>
  constructor(config: RouterTreeConfig) {
    this.routes = new Map()
    this.config = { ...config, viewsDir: config?.viewsDir ?? vars.VIEWS_DIR }
    this.cache = new Map()
    this.root = Node.create(this.config.index)
    this.routes.set(this.root.getPath(), this.root)
    this.root.setComponent(this.config.layout)
  }

  get parent(): AsyncComponnet {
    return this.config.layout
  }

  /**
   * 返回当前文件夹根路径,默认`/src/views/`
   */
  setPrefix(prefix: string | RegExp): this {
    this.config.viewsDir = prefix
    return this
  }

  /**
   * 设置文件夹根路径,默认`/src/views/`
   */
  getPrefix(): string | RegExp {
    return this.config?.viewsDir ?? vars.VIEWS_DIR
  }

  /**
   * 解析路由并生成路由数
   * @param records `import.meta.glob`之后的路由集合
   * @param cfg.preset 添加预设路由
   * @param cfg.append 在已有的基础上添加 默认: `false`
   */
  resolve(records: Record<string, AsyncComponnet>, cfg?: ResolveConfig): this {
    if (!cfg?.append) {
      this.routes.clear()
    }
    Object.entries(records).forEach(kv => {
      this.add(kv[0], kv[1])
    })
    return this
  }

  /**
   * 生成路由数组，只有一个`/`根节点，标准的树节点
   */
  generate(): Router {
    return this.root.generateRouter()
  }

  /**
   * 对节点树进行遍历迭代
   */
  iter<T extends IterableRoute<T>>(callback: (node: Router) => T) {
    const router = this.root.generateRouter()
    return this.root.generate(router, callback)
  }

  /**
   * 对节点树进行遍历迭代
   */
  iterRouter<T extends IterableRoute<T>>(router: Router, callback: (node: Router) => T) {
    return this.root.generate(router, callback)
  }

  /**
   * 添加路由节点
   * @param path 路径 必须以`this.getPrefix()`开头
   * @param asyncComp 路径对应的 Component
   */
  add(path: string, asyncComp: AsyncComponnet): this {
    if (!path.replace(this.getPrefix(), this.__PREFIX__).startsWith(this.__PREFIX__)) {
      console.warn(`path must start with ${this.getPrefix()}`)
      return this
    }
    const fileName = path.slice(path.lastIndexOf("/") + 1)
    if (vars.FILE_REG.test(fileName)) {
      this.push(this.root, this.root.getPath(), path.replace(this.getPrefix(), ""), asyncComp)
    }
    return this
  }

  find(path: string): Node | null {
    const p = resolvePath(path)
    const curNode: Node = this.root
    const cache = this.cache.get(p)
    if (cache) {
      return cache
    }
    const res = this._find(p, curNode.getPath(), curNode)
    if (res) {
      this.cache.set(p, res)
      return res
    }
    return null
  }

  private _find(dstPath: string, curPath: string, curNode: Node): Node | null {
    if (dstPath === curPath) {
      return curNode
    } else {
      const child = curNode.getChild()
      if (child.length > 0) {
        for (let i = 0; i < child.length; i++) {
          const res = this._find(dstPath, resolvePath([curNode.getPath(), child[i].getPath()]), child[i])
          if (res) {
            return res
          }
        }
        return null
      } else {
        return null
      }
    }
  }

  private push(parent: Node, parentAbsPath: string, path: string, comp: AsyncComponnet): void {
    if (path.length === 0) return
    const subCount = path.match(vars.SUBPAGE_REG)?.length ?? 0
    if (subCount === 0) {
      if (path.replace(vars.DEFAULT_PATH_REG, "").length == 0) {
        parent.setComponent(comp)
      } else {
        const finalPath = resolvePath(path.replace(vars.DEFAULT_PATH_REG, "").replace(vars.FILE_EXT_REG, ""))
        const currentPath = resolvePath(finalPath, false)
        // 路径: `{当前路径}`
        const childNode = Node.create(currentPath)
        // 路径映射:`/{绝对路径}/{当前路径}`
        this.routes.set(resolvePath([parentAbsPath, currentPath]), childNode)
        childNode.setComponent(comp)
        parent.pushChild(childNode)
        if (this.config.redirect) {
          const child = parent.getChild()
          const def = child.find(v => v.getPath() === vars.DEFAULT_PATH)
          if (def) {
            parent.setRedirect(resolvePath([parentAbsPath, def.getPath()]))
          } else if (child.length > 0 && this.config.redirectToChild) {
            parent.setRedirect(resolvePath([parentAbsPath, child[0].getPath()]))
          }
        }
      }
    } else {
      const paths = path.split(vars.SUBPAGE_REG)
      const current = resolvePath([parentAbsPath, paths[0]])
      let currentNode = this.routes.get(current)
      if (!currentNode) {
        currentNode = Node.create(paths[0])
        this.routes.set(current, currentNode)
        parent.pushChild(currentNode)
      }
      this.push(currentNode, current, paths.slice(1).join(vars.SEPARATOR), comp)
    }
  }
}
