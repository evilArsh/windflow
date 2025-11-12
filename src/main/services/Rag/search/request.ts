import axios, { AxiosRequestConfig } from "axios"

export function useRequest() {
  const axiosInstance = axios.create()
  /**
   * if `config.signal` was set, the `abort` function will not work
   */
  function request<T>(config: AxiosRequestConfig<any>) {
    let abortCtl: AbortController | undefined
    if (!config.signal) {
      abortCtl = new AbortController()
      config.signal = abortCtl.signal
    }
    function abort() {
      abortCtl?.abort("Request Aborted")
      abortCtl = undefined
    }
    return {
      getAbortController: () => abortCtl,
      abort,
      pending: axiosInstance.request<T>(config),
    }
  }
  return {
    getInstance: () => axiosInstance,
    request,
  }
}
