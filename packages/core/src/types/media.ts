export type MediaType = "image" | "video" | "audio" | "file"
export type Media = {
  id: string
  type: MediaType
  name: string
  data: Blob
  size?: number
}
export type MediaSrc = {
  id: string
  url: string
  type: MediaType
}
