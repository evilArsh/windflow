export interface StoreKey {
  MainWindowTheme: string
  /**
   * 记录打开目录时的默认位置
   */
  OpenDefaultPath: string
}

export interface StoreCore {
  get<K extends keyof StoreKey>(event: K, defaultValue?: StoreKey[K]): StoreKey[K]
  set<K extends keyof StoreKey>(event: K, value: StoreKey[K]): void
}
