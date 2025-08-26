<script lang="ts" setup>
import { CSSProperties } from "@toolmain/shared"

const {
  normal = false,
  normalIcon = false,
  wrapStyle = {},
  wrapClass = "",
  mainStyle = {},
  mainClass = "",
  defaultLock = false,
  needLock = false,
  stillLock = false,
  background = false,
  // disabled = false,
} = defineProps<{
  wrapStyle?: CSSProperties
  wrapClass?: string
  mainStyle?: CSSProperties
  mainClass?: string
  normal?: boolean
  /**
   * 图标是否有hover效果
   */
  normalIcon?: boolean
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
   * 是否有背景
   */
  background?: boolean
  /**
   * 是否禁用
   */
  // disabled?: boolean
}>()
const emit = defineEmits<{
  /**
   * 按下时触发，并改变锁定状态
   * @param status 锁定状态
   */
  lock: [status: boolean]
  iconClick: [e: MouseEvent]
  click: [e: MouseEvent]
}>()
const active = ref(false)
const handle = {
  toggleLock: (toggle?: boolean) => {
    if (stillLock) return
    if (!needLock) return
    active.value = toggle ?? !active.value
    emit("lock", active.value)
  },
  click: (e: MouseEvent) => {
    // if (disabled) return
    handle.toggleLock()
    emit("click", e)
  },
  iconClick: (e: MouseEvent) => {
    emit("iconClick", e)
  },
}
watch(
  () => defaultLock,
  v => {
    active.value = v
  },
  { immediate: true }
)
</script>
<template>
  <div
    class="comp-content-box"
    :class="[{ active, normal, background }, wrapClass]"
    :style="wrapStyle"
    @click="handle.click">
    <div v-if="$slots.header" class="box-header">
      <slot name="header"></slot>
    </div>
    <div class="box-main" :style="mainStyle" :class="[mainClass]">
      <div v-if="$slots.icon" @click="handle.iconClick" :class="{ 'normal-icon': normalIcon }" class="box-icon">
        <slot name="icon"></slot>
      </div>
      <div class="box-text"><slot> </slot></div>
      <div v-if="$slots.end" class="box-end"><slot name="end"></slot></div>
    </div>
    <div v-if="$slots.footer" class="box-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.normal {
  --box-shadow-color: transparent;
  --box-active-shadow-color: transparent;
  --box-bg-color: transparent;
  --box-hover-bg-color: transparent;
  --box-active-bg-color: transparent;
}
.comp-content-box {
  --box-shadow-color: var(--el-fill-color-lighter);
  --box-active-shadow-color: var(--el-fill-color-light);
  // --box-shadow-color: var(--el-color-primary-light-8);
  // --box-active-shadow-color: var(--el-color-primary-light-7);
  --box-bg-color: transparent;
  --box-hover-bg-color: var(--el-fill-color-dark);
  --box-active-bg-color: var(--el-fill-color-darker);
  &.background {
    --box-bg-color: transparent;
    --box-hover-bg-color: var(--el-color-info-light-7);
    --box-active-bg-color: var(--el-color-info-light-5);
  }
  &.normal {
    @extend .normal;
  }
}
.comp-content-box {
  -webkit-app-region: no-drag;
  --content-box-padding: var(--ai-gap-small);
  --content-box-margin: var(--ai-gap-small);
  user-select: none;
  cursor: pointer;
  margin: var(--content-box-margin);
  padding: var(--content-box-padding);
  border-radius: 5px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: var(--ai-gap-base);
  background-color: var(--box-bg-color);

  --box-icon-color: var(--el-text-color-regular);
  --box-icon-hover-color: var(--el-color-primary-light-7);
  --box-icon-active-color: var(--el-color-primary-light-5);
  &:hover {
    background-color: var(--box-hover-bg-color);
    box-shadow: 0 0 3px var(--box-shadow-color);
  }
  &:active,
  &.active {
    background-color: var(--box-active-bg-color);
    box-shadow: 0 0 5px var(--box-active-shadow-color);
  }
  .box-main {
    display: flex;
    gap: var(--ai-gap-base);
    align-items: center;
  }
  .box-icon {
    flex-shrink: 0;
    transition: all 0.3s ease-in-out;
    padding: 2px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--box-icon-color);
    &.normal-icon {
      --box-icon-hover-color: transparent;
      --box-icon-active-color: transparent;
    }
    &:hover {
      background-color: var(--box-icon-hover-color);
    }
    &:active {
      background-color: var(--box-icon-active-color);
    }
  }
  .box-text {
    flex: 1;
    white-space: normal;
    // word-break: break-word;
    display: flex;
    align-items: center;
  }
  .box-end {
    flex-shrink: 0;
  }
}
</style>
