<template>
  <div class="hover-wrap">
    <el-tooltip
      size="small"
      effect="light"
      :content="describe"
      placement="top"
      :show-arrow="false"
      :show-after="500"
      :disabled="!describe">
      <div class="hover-wrap--content" ref="wrapper">
        <slot></slot>
      </div>
    </el-tooltip>
  </div>
</template>
<script lang="ts" setup>
const {
  defaultLock = false,
  needLock = false,
  stillLock = false,
  shadowColor = "rgba(0, 0, 0, 0.1)",
  activeShadowColor = "rgba(0, 0, 0, 0.2)",
  rippleSize = "3px",
  background = false,
} = defineProps<{
  /**
   * 默认保持按下状态
   */
  defaultLock?: boolean
  /**
   * 该模式下点击时会保持，再次点击取消保持
   */
  needLock?: boolean
  /**
   * 该模式下`needLock`模式失效，组件的保持状态和`defaultLock`状态一致
   */
  stillLock?: boolean
  /**
   * hover时显示描述
   */
  describe?: string
  /**
   * 波纹颜色
   */
  shadowColor?: string
  /**
   * 波纹激活颜色
   */
  activeShadowColor?: string
  /**
   * 波纹大小
   */
  rippleSize?: string
  /**
   * 背景和波纹是否同时存在
   */
  background?: boolean
}>()
const emit = defineEmits<{
  /**
   * 按下时触发，并改变锁定状态
   * @param status 锁定状态
   */
  lock: [status: boolean]
}>()
const wrapper = shallowRef<HTMLElement>() // 包裹元素
const target = shallowRef<HTMLElement>() // 目标元素
const data = reactive({
  locked: false,
  isEnter: false,
  shadow: `0 0 0 ${rippleSize} ${shadowColor}`,
  shadowActive: `0 0 0 ${rippleSize} ${activeShadowColor}`,
  transition: "all 0.3s ease",
})

const handle = {
  toggleLock: (toggle?: boolean) => {
    if (stillLock) return
    if (!needLock) return
    data.locked = toggle ?? !data.locked
    emit("lock", data.locked)
  },
  hover: () => {
    target.value?.style.setProperty("transition", data.transition)
    target.value?.style.setProperty("box-shadow", data.shadow)
    if (background) target.value?.style.setProperty("background-color", shadowColor)
  },
  leave: () => {
    target.value?.style.removeProperty("box-shadow")
    target.value?.style.removeProperty("transition")
    if (background) target.value?.style.removeProperty("background-color")
  },
  click: () => {
    handle.toggleLock()
  },
  mousedown: () => {
    target.value?.style.setProperty("box-shadow", data.shadowActive)
    if (background) target.value?.style.setProperty("background-color", activeShadowColor)
  },
}
const event = {
  mouseenter: () => {
    data.isEnter = true
    handle.hover()
  },
  mouseleave: () => {
    document.removeEventListener("mouseup", event.documentUp)
    data.isEnter = false
    if (stillLock) {
      defaultLock ? handle.hover() : handle.leave()
    } else {
      if (!data.locked) {
        handle.leave()
      }
    }
  },
  click: () => {
    handle.click()
  },
  mousedown: () => {
    handle.mousedown()
    document.addEventListener("mouseup", event.documentUp)
  },
  mouseup: () => {
    event.documentUp()
  },
  documentUp: () => {
    document.removeEventListener("mouseup", event.documentUp)
    if (stillLock) {
      defaultLock ? handle.hover() : handle.leave()
    } else {
      if (data.locked) {
        handle.hover()
      } else {
        data.isEnter ? handle.hover() : handle.leave()
      }
    }
  },
}
onMounted(() => {
  emit("lock", data.locked)
  const ch = wrapper.value?.firstElementChild
  if (ch instanceof HTMLElement) {
    target.value = ch
    target.value.addEventListener("mouseenter", event.mouseenter)
    target.value.addEventListener("mouseleave", event.mouseleave)
    target.value.addEventListener("mousedown", event.mousedown)
    target.value.addEventListener("mouseup", event.mouseup)
    target.value.addEventListener("click", event.click)
    defaultLock && handle.hover()
  }
})
watch(
  () => defaultLock,
  v => {
    if (v) {
      handle.hover()
    } else {
      handle.leave()
    }
  }
)
onBeforeUnmount(() => {
  target.value?.removeEventListener("mouseenter", event.mouseenter)
  target.value?.removeEventListener("mouseleave", event.mouseleave)
  target.value?.removeEventListener("click", event.click)
  target.value?.removeEventListener("mousedown", event.mousedown)
  target.value?.removeEventListener("mouseup", event.mouseup)
})
</script>
<style lang="scss" scoped>
.hover-wrap {
  display: contents;
  &--content {
    display: contents;
    user-select: none;
    cursor: pointer;
  }
}
</style>
