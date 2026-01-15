export interface ServiceCore {
  registerIpc: () => void
  dispose: () => void | Promise<void>
}
