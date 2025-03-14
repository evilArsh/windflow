import { type AsyncComponnet, type FetchConfig, type Filter } from "./types"
import * as vars from "./variable"

/**
 * 路径是否匹配正则表达式
 * @param {string} path - 路径
 * @param {RegExp} reg - 正则表达式
 */
export function isInclude(path: string, reg: RegExp): boolean {
  return reg.test(path)
}

/**
 * 多个正则表达式以`|`合并为一个
 */
export function regsOr(regs: RegExp[]): RegExp {
  const r: string[] = regs.map<string>(v => {
    return `(${v.source})`
  })
  return new RegExp(r.join("|"))
}

export function filterRecord<T>(records: Record<string, T>, filter?: Filter): Record<string, T> {
  if (filter) {
    let pKeys = Object.keys(records)
    const sDir: Record<string, T> = {}
    if (filter instanceof Function) {
      pKeys = pKeys.filter((v, i, a) => {
        return filter(v, i, a)
      })
    } else if (filter instanceof RegExp) {
      pKeys = pKeys.filter(v => {
        return filter.test(v)
      })
    } else {
      const _f = regsOr(filter)
      pKeys = pKeys.filter(v => {
        if (!_f.test(v)) {
          return false
        }
        return true
      })
    }
    return pKeys.reduce((prev, cur) => {
      prev[cur] = records[cur]
      return prev
    }, sDir)
  }
  return records
}

// export function refreshDir(fConfig?: FetchConfig): Record<string, AsyncComponnet> {
//   return fetchAllDir(fConfig)
// }

function _fetch<T>(pages: Record<string, () => Promise<T>>, config?: FetchConfig): Record<string, AsyncComponnet> {
  const res = filterRecord(pages, config?.withComponents ? undefined : val => !isInclude(val, vars.WITH_COMPONENT_REG))
  return filterRecord(res, config?.filter)
}
/**
 *
 *  返回`views`文件夹下所有.tsx
 *
 * "react-router-dom": "^6.22.0",
 */
export function fetchTsx<T>(fConfig?: FetchConfig): Record<string, AsyncComponnet> {
  const pages = import.meta.glob<T>("/src/views/**/*.tsx", { eager: false })
  return _fetch(pages, fConfig)
}

/**
 *  返回`views`文件夹下所有.jsx
 *
 * "react-router-dom": "^6.22.0",
 */
export function fetchJsx<T>(fConfig?: FetchConfig): Record<string, AsyncComponnet> {
  const pages = import.meta.glob<T>("/src/views/**/*.jsx", { eager: false })
  return _fetch(pages, fConfig)
}

/**
 *  返回`views`文件夹下所有.vue
 *
 */
export function fetchVue<T>(fConfig?: FetchConfig): Record<string, AsyncComponnet> {
  const pages = import.meta.glob<T>("/src/views/**/*.vue", { eager: false })
  return _fetch(pages, fConfig)
}
