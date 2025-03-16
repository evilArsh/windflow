/**
 * 将字符串组装为路径格式
 * @param path 路径或路径数组
 * @param withPrefix 是否需要 `/`前缀,default: true
 * @example eg: ["foo","bar"] ==> "foo/bar"
 */
export const resolvePath = (path: string | string[], withPrefix: boolean = true): string => {
  let p = Array.isArray(path) ? path.join("/") : path
  const isNetworkPath = /^[a-zA-Z]+:\/\//.test(p)
  if (isNetworkPath) {
    return p.replace(/(?<!:\/)\/+/g, "/")
  }
  p = p.replace(/\/+/g, "/")
  p = p === "/" ? p : p.endsWith("/") ? p.slice(0, -1) : p
  if (withPrefix) {
    p = p.startsWith("/") ? p : `/${p}`
  } else {
    p = p.startsWith("/") ? p.slice(1) : p
  }
  return p
}

/**
 * 本地图片资源
 * @param path 图片路径
 * @returns 图片资源路径
 */
export const localImg = (path: string) => {
  return new URL(`/src/assets/images/${path}`, import.meta.url).href
}

/**
 * 本地资源
 * @param path 资源路径
 * @returns 资源路径
 */
export const localAssets = (path: string) => {
  return new URL(`/src/assets/${path}`, import.meta.url).href
}
