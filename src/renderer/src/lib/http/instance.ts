import axios, { AxiosError, AxiosInstance } from "axios"

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
      return Promise.reject(error)
    }
  )
  return instance
}
