import { Provider, RequestConfig, RequestHandler, ResponseHandler } from "@renderer/types"
import axios, { AxiosInstance } from "axios"
export const useDeepSeek = <T extends Record<string, RequestConfig<string, any, any>>>(
  defaultProvider: Provider
): RequestHandler<T> => {
  const provider = shallowRef<Provider>(defaultProvider)
  const instance = shallowRef<AxiosInstance>(createInstance(defaultProvider))
  const reqMap = new Map<string, ResponseHandler<T[keyof T]["response"]>>()

  function createInstance(provider: Provider) {
    return axios.create({
      baseURL: provider.apiUrl,
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
      },
    })
  }
  function setProvider(newProvider: Provider) {
    provider.value = newProvider
    instance.value = createInstance(newProvider)
  }
  function request<K extends keyof T>(key: K, config: T[K]["config"]): ResponseHandler<T[K]["response"]> {
    const id = uniqueId()
    const abortController = new AbortController()
    const res = instance.value.request<T[K]["response"], T[K]["config"]>({
      ...config,
      url: key as string,
      signal: abortController.signal,
    })
    const handler: ResponseHandler<T[K]["response"]> = {
      getRequestId: () => id,
      getProvider: () => provider.value,
      restart: () => {},
      terminate: () => {
        abortController.abort()
        reqMap.delete(id)
      },
      onData: (callback: (message: T[K]["response"]) => void) => {
        res.then(callback).catch(err => {
          console.log(`[request error ${key as string}]`, err)
        })
      },
    }
    reqMap.set(id, handler)
    return handler
  }
  return {
    setProvider,
    request,
  }
}

// Promise<AxiosResponse<T[K]["response"], T[K]["config"]>>
