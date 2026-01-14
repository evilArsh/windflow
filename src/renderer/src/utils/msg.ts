import {
  msg as gMsg,
  msgError as gMsgError,
  msgInfo as gMsgInfo,
  msgPrimary as gMsgPrimary,
  msgSuccess as gMsgSuccess,
  msgWarning as gMsgWarning,
  isString,
  isUndefined,
} from "@toolmain/shared"

export function msg(...args: Parameters<typeof gMsg>) {
  const props = isUndefined(args[1])
    ? {
        offset: MessageHeadOffset,
      }
    : isString(args[1])
      ? {
          offset: MessageHeadOffset,
          type: args[1],
        }
      : args[1]
  gMsg(args[0], props)
}
/**
 * header offset, greater equals than css var: --ai-header-height
 */
const MessageHeadOffset = 45
export function msgError(...args: Parameters<typeof gMsgError>) {
  msg(...args, "error")
}
export function msgInfo(...args: Parameters<typeof gMsgInfo>) {
  msg(...args, "info")
}
export function msgPrimary(...args: Parameters<typeof gMsgPrimary>) {
  msg(...args, "primary")
}
export function msgSuccess(...args: Parameters<typeof gMsgSuccess>) {
  msg(...args, "success")
}
export function msgWarning(...args: Parameters<typeof gMsgWarning>) {
  msg(...args, "warning")
}
