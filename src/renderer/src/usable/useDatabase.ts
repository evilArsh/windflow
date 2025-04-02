import { HttpStatusCode } from "axios"

let globalDB: IDBDatabase | undefined
export interface DBResponse {
  code: HttpStatusCode
  msg: string
  data?: IDBDatabase
}

export interface TransactionResponse {
  code: HttpStatusCode
  msg: string
}

export const storeKey = {
  provider: "provider",
  nav: "nav",
  model: "model",
  chat_topic: "chat_topic",
  chat_message: "chat_message",
  settings: "settings",
}

export type StoreKey = keyof typeof storeKey

export const indexKey = {
  model_providerName_idx: "model_providerName_idx",
  model_type_idx: "model_type_idx",
  model_active_idx: "model_active_idx",
  chatTopic_chatMessageId_idx: "chatTopic_chatMessageId_idx",
  chatTopic_parentId_idx: "chatTopic_parentId_idx",
  chatTopic_createAt_idx: "chatTopic_createAt_idx",
}

export const name = "db-ai-mate"
export const version = 1

export const useDatabase = () => {
  const db = shallowRef<IDBDatabase | undefined>(globalDB)

  async function open(): Promise<DBResponse> {
    const res = await openDB()
    db.value = res.data
    return res
  }

  function close() {
    db.value?.close()
    db.value = undefined
  }

  async function add<T>(storeName: StoreKey, data: T) {
    return new Promise<number>(resolve => {
      open().then(() => {
        if (!db.value) {
          resolve(0)
          return
        }
        const ts = db.value.transaction(storeName, "readwrite")
        const store = ts.objectStore(storeName)
        const req = store.add(data)
        req.onsuccess = () => resolve(1)
        req.onerror = () => resolve(0)
      })
    })
  }

  async function del(storeName: StoreKey, query: IDBValidKey | IDBKeyRange) {
    return new Promise<number>(resolve => {
      open().then(() => {
        if (!db.value) {
          resolve(0)
          return
        }
        const ts = db.value.transaction(storeName, "readwrite")
        const store = ts.objectStore(storeName)
        const req = store.delete(query)
        req.onsuccess = () => resolve(1)
        req.onerror = () => resolve(0)
      })
    })
  }
  async function get<T>(storeName: StoreKey, query: IDBValidKey | IDBKeyRange) {
    return new Promise<T | null>(resolve => {
      open().then(() => {
        if (!db.value) {
          resolve(null)
          return
        }
        const ts = db.value.transaction(storeName, "readonly")
        const store = ts.objectStore(storeName)
        const result = store.get(query)
        result.onsuccess = e => {
          resolve((e.target as IDBRequest<any>).result)
        }
        result.onerror = () => {
          resolve(null)
        }
      })
    })
  }

  /**
   * @description 更新数据,数据不存在时添加
   */
  async function put<T>(storeName: StoreKey, id: string, newData: T) {
    return new Promise<number>(resolve => {
      open().then(() => {
        if (!db.value) {
          resolve(0)
          return
        }
        const ts = db.value.transaction(storeName, "readwrite")
        const store = ts.objectStore(storeName)
        const oldReq = store.get(id)
        oldReq.onsuccess = async e => {
          const oldData = (e.target as IDBRequest<any>).result
          if (oldData) {
            const data = { ...oldData, ...newData }
            const putReq = store.put(data)
            putReq.onsuccess = () => resolve(1)
            putReq.onerror = () => resolve(0)
          } else {
            resolve(await add(storeName, newData))
          }
        }
        oldReq.onerror = () => {
          resolve(0)
        }
      })
    })
  }

  async function count(storeName: StoreKey) {
    return new Promise<number>(resolve => {
      open().then(() => {
        if (!db.value) {
          resolve(0)
          return
        }
        const ts = db.value.transaction(storeName, "readonly")
        const store = ts.objectStore(storeName)
        const count = store.count()
        count.onsuccess = e => {
          resolve((e.target as IDBRequest<number>).result)
        }
        count.onerror = () => {
          resolve(0)
        }
      })
    })
  }

  async function getAll<T>(storeName: StoreKey): Promise<T[]> {
    return new Promise<T[]>(resolve => {
      open().then(() => {
        if (!db.value) {
          resolve([])
          return
        }
        const ts = db.value.transaction(storeName, "readonly")
        const store = ts.objectStore(storeName)
        const result = store.getAll()
        result.onsuccess = e => {
          resolve((e.target as IDBRequest<any>).result as T[])
        }
        result.onerror = () => {
          resolve([])
        }
      })
    })
  }

  async function request<T>(callback: (db: IDBDatabase) => Promise<T | null>): Promise<T | null> {
    return new Promise<T | null>(resolve => {
      open().then(async () => {
        if (!db.value) {
          resolve(null)
          return
        }
        // eslint-disable-next-line promise/no-callback-in-promise
        const res = await callback(db.value)
        resolve(res)
      })
    })
  }

  async function wrapRequest<T>(req: IDBRequest<T>) {
    return new Promise<T | null>(resolve => {
      req.onsuccess = e => resolve((e.target as IDBRequest<T>).result)
      req.onerror = () => resolve(null)
    })
  }

  async function wrapTransaction(ts: IDBTransaction): Promise<TransactionResponse> {
    return new Promise<DBResponse>(resolve => {
      ts.oncomplete = () => {
        resolve({ code: 200, msg: "ok" })
      }
      ts.onerror = e => {
        console.log("[transaction error]", e)
        resolve({ code: 500, msg: "transaction error" })
      }
    })
  }

  return {
    close,
    add,
    del,
    get,
    put,
    getAll,
    count,
    request,
    wrapRequest,
    wrapTransaction,
  }
}

/**
 * @description 创建IndexedDB
 */
async function openDB(options?: { onupgradeneeded: (db: IDBDatabase) => void }): Promise<DBResponse> {
  if (!window.indexedDB) {
    return { code: 500, msg: "indexedDB is not supported" }
  }
  if (globalDB) return { code: 200, msg: "ok", data: globalDB }
  return new Promise(resolve => {
    const request = window.indexedDB.open(name, version)
    request.onerror = () => {
      resolve({ code: 500, msg: `database open failed:${request.error?.message}` })
    }
    request.onsuccess = e => {
      globalDB = (e.target as IDBOpenDBRequest).result
      globalDB.addEventListener("versionchange", () => {
        globalDB?.close()
        console.log("[versionchange]")
      })
      resolve({ code: 200, msg: "database open success", data: globalDB })
    }
    request.onupgradeneeded = e => {
      console.log("[onupgradeneeded]")
      globalDB = (e.target as IDBOpenDBRequest).result
      options?.onupgradeneeded?.(globalDB)
    }
  })
}

export function initDB() {
  openDB({
    onupgradeneeded: db => {
      if (!db.objectStoreNames.contains(storeKey.provider)) {
        db.createObjectStore(storeKey.provider, { keyPath: "name", autoIncrement: false })
      }
      if (!db.objectStoreNames.contains(storeKey.nav)) {
        db.createObjectStore(storeKey.nav, { keyPath: "index", autoIncrement: false })
      }
      if (!db.objectStoreNames.contains(storeKey.model)) {
        const store = db.createObjectStore(storeKey.model, { keyPath: "id", autoIncrement: false })
        store.createIndex(indexKey.model_providerName_idx, "providerName", { unique: false })
        store.createIndex(indexKey.model_type_idx, "type", { unique: false })
        store.createIndex(indexKey.model_active_idx, "active", { unique: false })
      }
      if (!db.objectStoreNames.contains(storeKey.chat_topic)) {
        const store = db.createObjectStore(storeKey.chat_topic, { keyPath: "id", autoIncrement: false })
        store.createIndex(indexKey.chatTopic_chatMessageId_idx, "chatMessageId", { unique: false })
        store.createIndex(indexKey.chatTopic_parentId_idx, "parentId", { unique: false })
        store.createIndex(indexKey.chatTopic_createAt_idx, "createAt", { unique: false })
      }
      if (!db.objectStoreNames.contains(storeKey.chat_message)) {
        db.createObjectStore(storeKey.chat_message, { keyPath: "id", autoIncrement: false })
      }
      if (!db.objectStoreNames.contains(storeKey.settings)) {
        db.createObjectStore(storeKey.settings, { keyPath: "id", autoIncrement: false })
      }
    },
  })
}
