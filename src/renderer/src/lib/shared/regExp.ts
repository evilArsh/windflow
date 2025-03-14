/**
 * 正则表达式库
 */

/**
 * 手机号
 */
export const regMobile: RegExp = /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/

/**
 * 密码长度至少8位，包含大小字符，数字，特殊符号至少3类
 */
export const regPasswd: RegExp = /^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*,._])[0-9a-zA-Z!@#$%^&*,\\._]{8,12}$/

/**
 * 身份证
 */
export const regIdCard: RegExp =
  /^([1-6][1-9]|50)\d{4}(18|19|20)\d{2}((0[1-9])|10|11|12)(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/

/**
 * http
 */
export const regHttpUrl: RegExp =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/

/**
 * websocket url
 */
export const regSocketUrl: RegExp =
  /^wss?:\/\/[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/

/**
 * sip url
 */
export const regSipUrl: RegExp = /^(sip|sips):([^@]+)@(.+)/

/**
 * 文件名
 */
// export const regFileName: RegExp = /[^<>/\\|:"*?]+\\.\w+$/
