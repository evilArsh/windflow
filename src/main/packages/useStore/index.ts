import Store from "electron-store"
import { PackageCore } from "@main/types"
import { StoreCore, StoreKey } from "./types"

export default (): PackageCore & StoreCore => {
  const store = new Store()
  function get<K extends keyof StoreKey>(event: K, defaultValue?: StoreKey[K]): StoreKey[K] {
    return store.get(event, defaultValue) as StoreKey[K]
  }
  function set<K extends keyof StoreKey>(event: K, value: StoreKey[K]) {
    store.set(event, value)
  }
  function dispose() {}
  return {
    dispose,
    get,
    set,
  }
}
