export type MediaType = "image" | "video" | "audio" | "file"
export type Media = {
  id: string
  type: MediaType
  name: string
  /**
   * the data may be the following situations:
   *
   * 1. `blob:` the blob data
   * 2. `base64:` the base64 data
   * 3. raw text: the file was readed as text (if possible)
   */
  data: Blob | string
  size?: number
  /**
   * local absolute file path, if a url for a network resource
   */
  path?: string
  extension?: string
}
