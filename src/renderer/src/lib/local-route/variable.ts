/**
 *  文件名以及路径名
 */
export const NAME_REG = /[^\\/:*?"<>|]+/
/**
 * 子页面标识
 */
export const SUBPAGE_REG = /\/subpages\//
/**
 * 组件标识
 */
export const COMPONENT_REG = /\/components\//
/**
 * 文件扩展名
 */
export const FILE_EXT_REG = /\.([jt]sx|vue)$/
/**
 * 文件名
 */
export const FILE_REG = new RegExp(`${NAME_REG.source}(${FILE_EXT_REG.source})`)
/**
 * 路径分隔符
 */
export const SEPARATOR_REG = /\//
/**
 * 路径分隔符
 */
export const SEPARATOR = "/"
export const SUBPAGES = "/subpages"
/**
 * 默认路径
 */
export const DEFAULT_PATH_REG = new RegExp(`index${FILE_EXT_REG.source}`)
/**
 * 默认路径
 */
export const DEFAULT_PATH = "index"
/**
 *  包含views一级子目录的文件
 */
export const WITH_ROOT_REG = new RegExp(`/src/views/${FILE_REG.source}`)
/**
 *  路径中带有 /component[s]/ 的组件文件.TODO: ios不支持零宽断言
 */
export const WITH_COMPONENT_REG = new RegExp(`components(/${NAME_REG.source}){0,}/${FILE_REG.source}`)
export const VIEWS_DIR = "/src/views/"
