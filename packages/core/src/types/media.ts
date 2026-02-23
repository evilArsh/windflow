export type Media = {
  id: string
  type: "image" | "video" | "audio" | "file"
  name: string
  data: Blob
  size?: number
}
