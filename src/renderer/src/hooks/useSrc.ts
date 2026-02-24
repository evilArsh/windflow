import { useRequest } from "@windflow/core/provider"
import { errorToText, isArrayLength, uniqueId } from "@toolmain/shared"
import { useTask } from "@renderer/hooks/useTask"
import PQueue from "p-queue"
import { msg } from "@renderer/utils"
import { useMedia } from "./useCore"
import { MediaType, MediaSrc } from "@windflow/core/types"
export function useSrc() {
  const data = ref<MediaSrc[]>([])
  const http = useRequest()
  const { isPending, ...task } = useTask(new PQueue())
  const blobTmp: Map<string, string> = new Map()
  const media = useMedia()
  function addResource(url: string, type: MediaType, id?: string) {
    const _id = id ?? uniqueId()
    data.value.push({
      id: _id,
      url,
      type,
    })
    if (url.startsWith("blob:")) {
      blobTmp.set(_id, url)
    }
  }
  function addFile(file: File, type: MediaType) {
    const tmp = URL.createObjectURL(file)
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
        addResource(tmp, type)
      } catch (error) {
        console.error("[download src]", error)
      }
    })
  }
  function retrieveFromDB(mediaIds: string[] | undefined) {
    // console.log("mediaIds:", mediaIds)
    if (!mediaIds || !isArrayLength(mediaIds)) {
      abortAll()
      clearSrc()
      return
    }
    // the data to be removed will not be in mediaIds.
    const toRemove = data.value.filter(item => !mediaIds.includes(item.id)).map(item => item.id)
    // const currentDataIds = data.value.map(item => item.id)
    // const toAdd = mediaIds.filter(mediaId => !currentDataIds.includes(mediaId))
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
            if (res) {
              const tmp = URL.createObjectURL(res.data)
              addResource(tmp, res.type, res.id)
            }
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
