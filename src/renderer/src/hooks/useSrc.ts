import { useRequest } from "@windflow/core/provider"
import { errorToText, isArrayLength, isString, uniqueId } from "@toolmain/shared"
import { useTask } from "@renderer/hooks/useTask"
import PQueue from "p-queue"
import { msg } from "@renderer/utils"
import { useMedia } from "./useCore"
import { MediaType, Media } from "@windflow/core/types"
export function useSrc() {
  const data = ref<Media[]>([])
  const http = useRequest()
  const { isPending, ...task } = useTask(new PQueue())
  const blobTmp: Map<string, string> = new Map()
  const media = useMedia()
  function addResource(media: Media) {
    data.value.push(media)
    if (isString(media.data) && media.data.startsWith("blob:")) {
      blobTmp.set(media.id, media.data)
    }
  }
  function addFile(file: File, type: MediaType) {
    addResource({
      id: uniqueId(),
      type,
      name: file.name,
      data: URL.createObjectURL(file),
      size: file.size,
    })
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
        addResource({
          id: uniqueId(),
          type,
          name: url.slice(url.lastIndexOf("/") + 1),
          data: URL.createObjectURL(res.data),
          path: url,
        })
      } catch (error) {
        console.error("[download src]", error)
      }
    })
  }
  function retrieveFromDB(mediaIds: string[] | undefined) {
    if (!mediaIds || !isArrayLength(mediaIds)) {
      abortAll()
      clearSrc()
      return
    }
    // the data to be removed will not be in mediaIds.
    const toRemove = data.value.filter(item => !mediaIds.includes(item.id)).map(item => item.id)
    data.value = data.value.filter(item => !toRemove.includes(item.id))
    toRemove.forEach(mediaId => {
      const tmp = blobTmp.get(mediaId)
      tmp?.startsWith("blob:") && URL.revokeObjectURL(tmp)
      blobTmp.delete(mediaId)
    })
    for (const mediaId of mediaIds) {
      if (!data.value.find(item => item.id === mediaId)) {
        task.add(async ({ signal }) => {
          try {
            const res = await media.getStorage().get(mediaId)
            if (signal?.aborted) return
            if (!res) return
            addResource({ ...res })
          } catch (error) {
            msg({ code: 500, msg: errorToText(error) })
          }
        })
      }
    }
  }
  function abortAll() {
    http.abortAll()
    task.clear()
  }
  function clearSrc() {
    for (const value of blobTmp.values()) {
      URL.revokeObjectURL(value)
    }
    blobTmp.clear()
    data.value = []
  }
  function dispose() {
    task.getQueue().removeAllListeners()
    abortAll()
    clearSrc()
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
