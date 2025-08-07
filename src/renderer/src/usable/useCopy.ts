import { useClipboard } from "@vueuse/core"

export default () => {
  const { copy } = useClipboard()
  const copied = ref(false)
  async function onCopy(data?: string) {
    try {
      if (copied.value) return
      await copy(data ?? "")
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    } catch (_) {
      copied.value = false
    }
  }
  return {
    onCopy,
    copied,
  }
}
