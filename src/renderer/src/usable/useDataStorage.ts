export default () => {
  async function save<T>(key: string, data: T) {
    localStorage.setItem(key, JSON.stringify(data))
  }

  async function get<T>(key: string): Promise<T | null> {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async function remove(key: string) {
    localStorage.removeItem(key)
  }

  async function clear() {
    localStorage.clear()
  }
  return {
    save,
    get,
    remove,
    clear,
  }
}
