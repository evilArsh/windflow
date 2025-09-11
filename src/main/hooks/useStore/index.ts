import Store from "electron-store"
import { StoreCore, StoreKey } from "./types"

const store = new Store()
export const useStore = (): StoreCore => {
  function get<K extends keyof StoreKey>(event: K, defaultValue?: StoreKey[K]): StoreKey[K] {
    return store.get(event, defaultValue) as StoreKey[K]
  }
  function set<K extends keyof StoreKey>(event: K, value: StoreKey[K]) {
    store.set(event, value)
  }
  return {
    get,
    set,
  }
}
