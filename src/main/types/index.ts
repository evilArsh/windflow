export interface ServiceCore {
  registerIpc: () => void
  dispose: () => void
}

export interface PackageCore {
  dispose: () => void
}
