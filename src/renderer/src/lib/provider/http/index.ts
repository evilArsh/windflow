import { GeneralRequestHandler } from "@renderer/types"
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"

export const createInstance = (): AxiosInstance => {
  const instance = axios.create()
  instance.interceptors.request.use(
    config => {
      return config
    },
    (error: AxiosError) => {
      console.log("[request error]", error)
      return Promise.reject(error)
    }
  )
  instance.interceptors.response.use(
    response => {
      return response
    },
    (error: AxiosError) => {
      console.log("[response error]", error)
      return Promise.reject(error)
    }
  )
  return instance
}

export function useSingleRequest(): GeneralRequestHandler {
  let abortController: AbortController | undefined
  const instance = createInstance()
  function request<T = any, R = AxiosResponse<T>, D = any>(config: AxiosRequestConfig<D>): Promise<R> {
    terminate()
    abortController = new AbortController()
    config.signal = abortController.signal
    return instance.request(config)
  }
  function terminate() {
    abortController?.abort("Request Aborted")
    abortController = undefined
  }
  function getInstance() {
    return instance
  }
  return {
    getInstance,
    request,
    terminate,
  }
}
