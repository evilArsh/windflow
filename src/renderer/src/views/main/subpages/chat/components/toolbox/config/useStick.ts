import { ShallowRef, Ref } from "vue"
import { BaseMountedParams, ScaleInstance } from "@renderer/components/ScalePanel/types"
import { useDebounceFn } from "@vueuse/core"

export default (
  panel: ShallowRef<ScaleInstance | null>,
  toolWidth: Ref<number>,
  baseParams: Ref<BaseMountedParams | undefined>
) => {
  const lock = ref(false) // 是否锁定
  const hover = ref(false) // 是否悬停
  const scaling = ref(false) // 缩放中
  const moving = ref(false) // 移动中
  const timeout = ref(-1) // 折叠定时器
  const folded = ref(true) // 折叠状态
  async function fold(silient?: boolean) {
    await nextTick()
    await panel.value?.moveTo(!silient, {
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

  const scaleEv = {
    onScaleMounted: async (data: BaseMountedParams) => {
      baseParams.value = data
      await panel.value?.moveTo(false, "top")
      await panel.value?.moveTo(false, "right")
      panel.value?.show(false, "self")
      fold(true)
    },
    onScaling: () => {
      scaling.value = true
    },
    onMoving: () => {
      moving.value = true
    },
    onAfterMove: async () => {
      moving.value = false
      if (lock.value) return
      await fold()
    },
    onAfterScale: async () => {
      scaling.value = false
      if (lock.value) return
      await fold()
    },
    onWindowResize: useDebounceFn(
      async () => {
        if (lock.value) {
          await show()
        } else {
          await fold()
        }
      },
      100,
      { maxWait: 1000 }
    ),
  }

  window.addEventListener("resize", scaleEv.onWindowResize)
  onUnmounted(() => {
    window.removeEventListener("resize", scaleEv.onWindowResize)
  })
  return {
    lock,
    scaling,
    moving,
    hover,
    timeout,
    folded,
    scaleEv,
    fold,
    show,
    toggle,
    toggleLock,
    toggleHover,
    onMouseEnter,
    onMouseLeave,
  }
}
