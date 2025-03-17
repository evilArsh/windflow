import { AxiosRequestConfig } from "axios"

/**
 * 服务提供商
 */
export interface Provider {
  id: string
  name: string
  logo: string
  alias?: string
  apiUrl: string
  apiKey: string
}

export interface RequestConfig<M extends string, Q = any, S = any> {
  config: AxiosRequestConfig<Q> & { method: M }
  response: S
}
export interface ResponseHandler<T> {
  getRequestId: () => string
  getProvider: () => Provider
  restart: () => void
  terminate: () => void
  onData: (callback: (message: T) => void) => void
}
export interface RequestHandler<T extends Record<string, RequestConfig<string, any, any>>> {
  setProvider: (provider: Provider) => void
  request: <K extends keyof T>(key: K, config: T[K]["config"]) => ResponseHandler<T[K]["response"]>
}
