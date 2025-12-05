import { AxiosResponse, AxiosRequestConfig, AxiosInstance } from "axios"

export interface RequestHandler {
  getSignal: () => AbortSignal
  /**
   * maby you want to use your own controller
   */
  setController: (controller: AbortController) => void
  terminate: () => void
}
export interface GeneralRequestHandler extends RequestHandler {
  request: <T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>) => Promise<R>
  getInstance: () => AxiosInstance
}
