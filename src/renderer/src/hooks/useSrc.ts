import { useRequest } from "@windflow/core/provider"
import { errorToText } from "@toolmain/shared"
import { useTask } from "@renderer/hooks/useTask"
import PQueue from "p-queue"
import { msg } from "@renderer/utils"
import { useMedia } from "./useCore"
import { MediaType, MediaSrc } from "@windflow/core/types"
export function useSrc() {
  const data = ref<MediaSrc[]>([])
  const http = useRequest()
  const { isPending, ...task } = useTask(new PQueue())
  const blobTmp: string[] = []
  const media = useMedia()
  function addResource(url: string, type: MediaType) {
    data.value.push({
      url,
      type,
    })
  }
  function addFile(file: File, type: MediaType) {
    const tmp = URL.createObjectURL(file)
    blobTmp.push(tmp)
    addResource(tmp, type)
  }
  function download(url: string, type: MediaType) {
    task.add(async ({ signal }) => {
      try {
        const { promise } = http.request({
          url,
          method: "GET",
          responseType: "blob",
          signal,
        })
        const res = await promise
        const tmp = URL.createObjectURL(res.data)
        blobTmp.push(tmp)
        addResource(tmp, type)
      } catch (error) {
        console.error("[download src]", error)
      }
    })
  }
  function retrieveFromDB(mediaId: string) {
    task.add(async ({ signal }) => {
      try {
        const res = await media.getStorage().get(mediaId)
        if (signal?.aborted) return
        if (res) {
          const tmp = URL.createObjectURL(res.data)
          blobTmp.push(tmp)
          addResource(tmp, res.type)
        }
      } catch (error) {
        msg({ code: 500, msg: errorToText(error) })
      }
    })
  }
  function abortAll() {
    http.abortAll()
    task.clear()
  }
  function clearSrc() {
    data.value.length = 0
  }
  function dispose() {
    task.getQueue().removeAllListeners()
    abortAll()
    blobTmp.forEach(URL.revokeObjectURL)
  }

  return {
    data,
    isPending,
    addFile,
    abortAll,
    addResource,
    clearSrc,
    download,
    dispose,
    retrieveFromDB,
  }
}
