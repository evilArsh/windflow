import log from "electron-log"

export function useLog(scope: string) {
  return log.scope(scope)
}
