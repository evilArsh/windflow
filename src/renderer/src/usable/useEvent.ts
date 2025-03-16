/**
 * @author arshdebian@163.com
 * @description changed origin: https://github.com/browserify/events
 */
export interface EventBus<T extends Record<string, any>> {
  setMaxListeners(n: number): void
  addListener<K extends keyof T>(type: K, listener: T[K]): void
  removeAllListeners<K extends keyof T>(type?: K): void
  removeListener<K extends keyof T>(type: K, listener: T[K]): void
  prependListener<K extends keyof T>(type: K, listener: T[K]): void
  emit<K extends keyof T>(type: K, ...args: Parameters<T[K]>): void
  /**
   * addListener
   */
  on<K extends keyof T>(type: K, listener: T[K]): void
  /**
   * removeListener
   */
  off<K extends keyof T>(type: K, listener: T[K]): void
  once<K extends keyof T>(type: K, listener: T[K]): void
}
export type EventBusCallback = (...args: any[]) => any
const DefaultEventBus = <T extends Record<string, any> = { [x: string]: any }>(): EventBus<T> => {
  const defaultMaxListeners = 10
  let _events: Record<string, any> = {}
  let _eventCount = 0
  let _maxListeners = 10
  function init() {
    resetEvents()
    _eventCount = 0
    _maxListeners = defaultMaxListeners
  }
  function resetEvents() {
    _events = {}
  }
  function _getMaxListeners(): number {
    return _maxListeners
  }
  function _addListener(type: string, listener: EventBusCallback, prepend: boolean) {
    const events = _events
    let existing = events[type]
    if (!existing) {
      existing = events[type] = listener
      ++_eventCount
    } else {
      if (!Array.isArray(existing)) {
        existing = events[type] = prepend ? [listener, existing] : [existing, listener]
      } else if (prepend) {
        existing.unshift(listener)
      } else {
        existing.push(listener)
      }
      const m = _getMaxListeners()
      if (m > 0 && existing.length > m) {
        const w = new Error(
          "Possible EventEmitter memory leak detected. " +
            existing.length +
            " " +
            String(type) +
            " listeners " +
            "added. Use emitter.setMaxListeners() to " +
            "increase limit"
        )
        console.warn(w)
      }
    }
  }
  /**
   * @public
   */
  function removeListener<K extends keyof T>(type: K, listener: T[K]) {
    const events = _events
    const list = events[type as string]
    if (!list) return
    if (Array.isArray(list)) {
      let position = -1
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i] === listener) {
          position = i
          break
        }
      }
      if (position < 0) {
        return
      }
      list.splice(position, 1)
      if (list.length === 1) events[type as string] = list[0]
    } else if (list === listener) {
      if (--_eventCount === 0) {
        resetEvents()
      } else {
        delete events[type as string]
      }
    }
  }
  /**
   * @public
   */
  function removeAllListeners<K extends keyof T>(type?: K) {
    if (!type) {
      resetEvents()
      _eventCount = 0
      return
    }
    if (_events[type as string]) {
      if (--_eventCount === 0) {
        resetEvents()
      } else {
        delete _events[type as string]
      }
    }
  }
  /**
   * @public
   */
  function setMaxListeners(n: number) {
    if (n < 0) {
      throw new RangeError("The value of 'n' is out of range. It must be a non-negative number")
    }
    _maxListeners = n
  }
  /**
   * @public
   */
  function addListener<K extends keyof T>(type: K, listener: T[K]) {
    _addListener(type as string, listener, false)
  }
  /**
   * @public
   */
  function prependListener<K extends keyof T>(type: K, listener: T[K]) {
    _addListener(type as string, listener, true)
  }
  /**
   * @public
   */
  function emit<K extends keyof T>(type: K, ...args: Parameters<T[K]>) {
    const events = _events
    const handler = events[type as string]
    if (handler === undefined) return
    if (!Array.isArray(handler)) {
      handler(...args)
    } else {
      handler.forEach(val => {
        val(...args)
      })
    }
  }
  /**
   * @public
   */
  function once<K extends keyof T>(type: K, listener: T[K]) {
    const l = (...args: any[]) => {
      listener(...args)
      removeListener(type, l as any)
    }
    on(type, l as any)
  }
  /**
   * @public
   */
  const on = addListener
  const off = removeListener
  init()
  return {
    setMaxListeners,
    addListener,
    removeAllListeners,
    removeListener,
    prependListener,
    emit,
    on,
    off,
    once,
  }
}
export default DefaultEventBus
