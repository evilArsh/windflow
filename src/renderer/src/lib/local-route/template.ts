import type { AsyncComponnet, IterableRoute, ResolveConfig, Router, RouterTreeConfig } from "./types"
import * as vars from "./variable"
import { resolvePath } from "@renderer/lib/shared/resource"
import Node from "./node"

export class RouterTree {
  readonly root: Node
  private rawRoutes: Record<string, AsyncComponnet>
  private readonly __PREFIX__ = "__PREFIX__"
  private readonly config: RouterTreeConfig
  private readonly cache: Map<string, Node>
  constructor(config: RouterTreeConfig) {
    this.rawRoutes = {}
    this.config = { ...config, viewsDir: config?.viewsDir ?? vars.VIEWS_DIR }
    this.cache = new Map()
    this.root = Node.create(this.config.index)
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
      this.rawRoutes = {}
    }
    this.rawRoutes = records
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
   * @param func 路径对应的 Component
   */
  add(path: string, func: AsyncComponnet): this {
    if (!path.replace(this.getPrefix(), this.__PREFIX__).startsWith(this.__PREFIX__)) {
      console.warn(`path must start with ${this.getPrefix()}`)
      return this
    }
    const fileName = path.slice(path.lastIndexOf("/") + 1)
    if (vars.FILE_REG.test(fileName)) {
      const _path = path.replace(this.getPrefix(), "").replace(vars.FILE_EXT_REG, "")
      const pathArr = _path.split("/").filter(v => v.length > 0)
      this.push(this.root, this.root.getPath(), pathArr, func)
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

  /**
   root/test1/test1-1/index.vue => ["test1","test1-1","index"]
   root/index.vue               => ["index"]
   root/test1-1/test1-2.vue     => ["test1-1","test1-2"]
                root
              /  |  \
          test  ...  index.vue
          /  \
        test1 test2
        /      \
    test1-1   test2-1
       |        |
    index.vue name.vue
   */
  private push(prevNode: Node, prevPath: string, pathArr: string[], func: AsyncComponnet): void {
    if (pathArr.length === 0) {
      return
    }
    let mapedNode: Node | null = null
    const curPath = pathArr[0]
    const curFullPath = resolvePath([prevPath, curPath])
    const curNode = this.find(curFullPath)
    pathArr.splice(0, 1)
    if (curNode) {
      mapedNode = curNode
    } else {
      const child = prevNode.getChild()
      for (let i = 0; i < child.length; i++) {
        if (child[i].getPath() === curPath) {
          mapedNode = child[i]
          break
        }
      }
      if (!mapedNode) {
        // 创建一个新的子节点
        const childNode = Node.create(curPath)
        childNode.updateMeta({
          fullPath: resolvePath(pathArr),
        })
        child.push(childNode)
        mapedNode = childNode
      }
    }
    // mapedNode 为已存在的节点或新创建的节点
    const nodes = [
      { node: prevNode, path: resolvePath(prevPath) },
      { node: mapedNode, path: curFullPath },
    ]
    nodes.forEach(val => {
      this.setRedirect(val.node, val.path)
      val.node.updateMeta({
        fullPath: val.path,
      })
    })
    if (pathArr.length === 0) {
      mapedNode.setComponent(func)
      return
    }
    this.push(mapedNode, resolvePath([prevPath, curPath]), pathArr, func)
  }

  private setRedirect(node: Node, curPath: string): void {
    if (node.getPath() === this.config.index) {
      return
    }
    const curChild = node.getChild()
    const indexChild = curChild.find(val => {
      return val.getPath() === "index"
    })
    if (node.getComponent()) {
      if (node.getComponent() !== this.parent) {
        node.setRedirect(undefined)
        return
      }
    }
    // todo: 某个文件夹还未加载子目录，此时redirect为undefined
    if (indexChild) {
      node.setRedirect(resolvePath([curPath, "index"]))
    } else {
      node.setRedirect(curChild.length > 0 ? resolvePath([curPath, curChild[0].getPath()]) : undefined)
    }
  }
}
