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
  round = false,
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
  round?: boolean
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
    :class="[{ active, normal, background, round }, wrapClass]"
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
.comp-content-box {
  --box-padding: var(--ai-gap-small);
  --box-margin: 0;

  --box-border-radius: 5px;
  --box-border-color: transparent;
  --box-border-hover-color: transparent;
  --box-border-active-color: transparent;
  --box-border-size: 0;

  --box-shadow: 0 0 3px var(--el-fill-color-lighter);
  --box-shadow-active: 0 0 5px var(--el-fill-color-light);

  --box-bg-color: transparent;
  // --box-bg-hover-color: var(--el-fill-color-dark);
  // --box-bg-active-color: var(--el-fill-color-darker);
  --box-bg-hover-color: var(--el-color-info-light-7);
  --box-bg-active-color: var(--el-color-info-light-5);

  // --box-bg-background-color: var(--el-color-info-light-9);
  // --box-bg-background-hover-color: var(--el-color-info-light-7);
  // --box-bg-background-active-color: var(--el-color-info-light-5);

  --box-icon-color: var(--el-text-color-regular);
  --box-icon-hover-color: var(--el-color-primary-light-7);
  --box-icon-active-color: var(--el-color-primary-light-5);

  &.background {
    --box-bg-color: var(--el-color-info-light-9);
  }
  &.normal {
    --box-shadow: none;
    --box-shadow-active-color: none;
    --box-bg-color: transparent;
    --box-bg-hover-color: transparent;
    --box-bg-active-color: transparent;
  }
}
.comp-content-box {
  -webkit-app-region: no-drag;
  user-select: none;
  cursor: pointer;
  margin: var(--box-margin);
  padding: var(--box-padding);
  border-radius: var(--box-border-radius);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: var(--ai-gap-base);
  background-color: var(--box-bg-color);
  border: solid var(--box-border-size) var(--box-border-color);
  &.round {
    border-radius: var(--el-border-radius-round);
  }
  // &.background {
  // --box-bg-color: var(--el-color-info-light-9);
  // background-color: var(--box-bg-background-color);
  // &:hover {
  //   background-color: var(--box-bg-background-hover-color);
  // }
  // &:active,
  // &.active {
  //   background-color: var(--box-bg-background-active-color);
  // }
  // }
  &:hover {
    background-color: var(--box-bg-hover-color);
    box-shadow: var(--box-shadow);
    border-color: var(--box-border-hover-color);
  }
  &:active,
  &.active {
    background-color: var(--box-bg-active-color);
    box-shadow: var(--box-shadow-active);
    border-color: var(--box-border-active-color);
  }
  &.normal {
    @extend .normal;
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
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
}
</style>
