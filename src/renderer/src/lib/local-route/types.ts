export type Component = unknown
export type AsyncComponnet = () => Promise<Component>
export type Filter = ((value: string, index?: number, array?: string[]) => boolean) | RegExp | RegExp[]
export interface IterableRoute<T> {
  children?: T[] | null
}
/**
 * 每个路由元数据
 */
export interface RouterMeta {
  [key: string]: unknown
  title: string
  path: string
  fullPath: string
  redirect?: string
}
/**
 * 通用单个路由结构
 */
export interface Router {
  path: string
  meta: RouterMeta
  redirect?: string
  component?: AsyncComponnet
  children?: Router[]
}
export type Platform = "mobile" | "desktop"
/**
 * 路由解析配置
 */
export interface ResolveConfig {
  platform: Platform
  append?: boolean
}
/**
 * 路由数解析初始化配置
 */
export interface RouterTreeConfig {
  /**
   *  默认首页
   */
  index: string
  /**
   * 根路由布局组件
   *
   * react 包含 `<Outlet />`
   *
   * vue   包含 `<RouterView />`
   */
  layout: AsyncComponnet
  /**
   *  需要截断的路由路径字符串前缀 default: `/src/views/`
   */
  viewsDir?: string | RegExp
}
/**
 * `import.meta.glob`加载路由数据配置
 */
export interface FetchConfig {
  /**
   * 是否包含带有`/component[s]`的路径
   */
  withComponents?: boolean
  /**
   * 过滤路径
   */
  filter?: Filter
}
