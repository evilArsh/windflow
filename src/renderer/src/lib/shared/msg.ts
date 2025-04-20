import { ElMessage } from "element-plus"
type ElMsg = "success" | "warning" | "info" | "error"
interface MsgEle {
  msg: string
  code?: number
  type?: ElMsg
}

const msgMap: Record<ElMsg, (txt: string) => void> = {
  success: content => {
    ElMessage({ type: "success", message: content })
  },
  warning: content => {
    ElMessage({ type: "warning", message: content })
  },
  info: content => {
    ElMessage({ type: "info", message: content })
  },
  error: content => {
    ElMessage({ type: "error", message: content })
  },
}

function codeToType(code: number): ElMsg {
  const codeStr = code.toString()
  if (codeStr.startsWith("2") || codeStr.startsWith("1")) {
    return "success"
  } else if (codeStr.startsWith("3")) {
    return "info"
  } else if (codeStr.startsWith("4")) {
    return "warning"
  } else if (codeStr.startsWith("5")) {
    return "error"
  } else {
    return "info"
  }
}

/**
 * element-plus 消息弹窗
 * ```plain
 * code类型:
 *  1xx|2xx success
 *  3xx     info
 *  4xx     warning
 *  5xx|6xx error
 *  default info
 * ```
 * `type` 和 `code` 同时存在时,`type`优先
 */
export function msg(message: MsgEle | string): void {
  if (typeof message === "string") {
    msg({
      msg: message,
      code: 200,
    })
    return
  }
  if (message.type) {
    msgMap[message.type](message.msg)
  } else if (message.code) {
    msgMap[codeToType(message.code)](message.msg)
  } else {
    msgMap.success(message.msg)
  }
}
