/**
 *  文件名以及路径名
 */
export const NAME_REG = /[\w\u4e00-\u9fa5]+/
export const SUBPAGE_REG = /\/subpage[s]?\//
export const COMPONENT_REG = /\/component[s]?\//
export const FILE_EXT_REG = /\.([jt]sx|vue)$/
export const FILE_REG = new RegExp(`${NAME_REG.source}(${FILE_EXT_REG.source})$`)
/**
 *  包含views一级子目录的文件
 */
export const WITH_ROOT_REG = new RegExp(`/src/views/${FILE_REG.source}`)
/**
 *  路径中带有 /component[s]/ 的组件文件.TODO: ios不支持零宽断言
 */
export const WITH_COMPONENT_REG = new RegExp(`component[s]?(/${NAME_REG.source}){0,}/${FILE_REG.source}`)
export const VIEWS_DIR = "/src/views/"
