export interface DbData {
  /**
   * 必须是一个完整的 URI,包含schema
   */
  filename: string
  blob: Blob
}
export enum DBStoreName {
  Provider = "provider",
  Model = "model",
}
export const name = "db-candy-box"
export const version = 1
export class DBManager {
  private db?: IDBDatabase
  constructor() {}

  #initStores(db: IDBDatabase) {
    if (!db.objectStoreNames.contains(DBStoreName.Provider)) {
      const store = db.createObjectStore(DBStoreName.Provider, {
        keyPath: "name",
        autoIncrement: false,
      })
      store.createIndex("name_idx", "name", { unique: true })
    }
    if (!db.objectStoreNames.contains(DBStoreName.Model)) {
      const store = db.createObjectStore(DBStoreName.Model, {
        keyPath: "id",
        autoIncrement: false,
      })
      store.createIndex("id_idx", "id", { unique: true })
    }
  }
  async init(): Promise<{ code: number; msg: string; data?: IDBDatabase }> {
    if (!window.indexedDB) {
      return { code: 500, msg: "indexedDB is not supported" }
    }
    const request = window.indexedDB.open(name, version)
    return new Promise(resolve => {
      const response = (data: { code: number; msg: string; data?: IDBDatabase }) => {
        console.log("[init response]", data)
        resolve(data)
      }
      request.onerror = () => {
        response({ code: 500, msg: `database open failed:${request.error?.message}` })
      }
      request.onsuccess = e => {
        this.db = (e.target as IDBOpenDBRequest).result
        this.db.addEventListener("versionchange", () => {
          this.db?.close()
          console.log("[versionchange]")
        })
        response({ code: 200, msg: "database open success", data: this.db })
      }
      request.onupgradeneeded = e => {
        console.log("[onupgradeneeded]")
        this.db = (e.target as IDBOpenDBRequest).result
        this.#initStores(this.db)
      }
    })
  }
}
