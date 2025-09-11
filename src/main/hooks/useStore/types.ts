export interface StoreKey {
  MainWindowTheme: string
}

export interface StoreCore {
  get<K extends keyof StoreKey>(event: K, defaultValue?: StoreKey[K]): StoreKey[K]
  set<K extends keyof StoreKey>(event: K, value: StoreKey[K]): void
}
