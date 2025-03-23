import { ShallowRef, Ref } from "vue"
import { ScaleInstance } from "@renderer/components/ScalePanel/types"

export default (panel: ShallowRef<ScaleInstance | null>, toolWidth: Ref<number>) => {
  const lock = ref(false)
  const hover = ref(true)
  const scaling = ref(false)
  const moving = ref(false)
  const timeout = ref(-1)
  const folded = ref(false)
  async function fold() {
    await nextTick()
    await panel.value?.moveTo(true, {
      x: toNumber(window.innerWidth - toolWidth.value),
    })
    folded.value = true
  }
  async function show() {
    await nextTick()
    await panel.value?.stickTo("right", true)
    folded.value = false
  }
  async function toggle() {
    if (folded.value) {
      await show()
    } else {
      await fold()
    }
  }
  function toggleLock(l: boolean) {
    lock.value = l
  }
  function toggleHover(h: boolean) {
    hover.value = h
  }
  async function onMouseEnter() {
    if (!hover.value) return
    if (moving.value || scaling.value) return
    clearTimeout(timeout.value)
    await show()
  }
  async function onMouseLeave() {
    if (!hover.value) return
    if (moving.value || scaling.value) return
    timeout.value = window.setTimeout(async () => {
      await fold()
    }, 500)
  }

  return {
    lock,
    scaling,
    moving,
    hover,
    timeout,
    folded,
    fold,
    show,
    toggle,
    toggleLock,
    toggleHover,
    onMouseEnter,
    onMouseLeave,
  }
}
