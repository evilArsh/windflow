<script lang="ts" setup>
import { CSSProperties } from "@renderer/lib/shared/types"
const {
  normal = false,
  wrapStyle = {},
  mainStyle = {},
  defaultLock = false,
  needLock = false,
  stillLock = false,
  background = false,
} = defineProps<{
  wrapStyle?: CSSProperties
  mainStyle?: CSSProperties
  normal?: boolean
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
  <div class="comp-content-box" :class="{ active, normal, background }" :style="wrapStyle" @click="handle.click">
    <div v-if="$slots.header" class="box-header">
      <slot name="header"></slot>
    </div>
    <div class="box-main" :style="mainStyle">
      <div v-if="$slots.icon" @click="handle.iconClick" class="box-icon"><slot name="icon"></slot></div>
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
  --box-shadow-color: rgba(0, 0, 0, 0.1);
  --box-active-shadow-color: rgba(0, 0, 0, 0.2);
  --box-icon-color: var(--el-text-color-regular);
  --box-icon-hover-color: rgba(10, 205, 231, 0.1);
  --box-icon-active-color: rgba(10, 205, 231, 0.2);
  --box-bg-color: transparent;
  --box-active-bg-color: transparent;
  &.background {
    --box-bg-color: var(--box-shadow-color);
    --box-active-bg-color: var(--box-active-shadow-color);
  }
}
html.dark .comp-content-box {
  --box-shadow-color: rgba(255, 255, 255, 0.2);
  --box-active-shadow-color: rgba(255, 255, 255, 0.3);
  --box-icon-color: var(--el-text-color-regular);
  --box-icon-hover-color: rgba(10, 205, 231, 0.3);
  --box-icon-active-color: rgba(10, 205, 231, 0.4);
  --box-bg-color: transparent;
  --box-active-bg-color: transparent;
  &.background {
    --box-bg-color: var(--box-shadow-color);
    --box-active-bg-color: var(--box-active-shadow-color);
  }
}

.comp-content-box.normal {
  --box-shadow-color: transparent;
  --box-active-shadow-color: transparent;
  --box-icon-color: var(--el-text-color-regular);
  --box-icon-hover-color: rgba(10, 205, 255, 0.3);
  --box-icon-active-color: rgba(10, 205, 255, 0.4);
  --box-bg-color: transparent;
  --box-active-bg-color: transparent;
}

.comp-content-box {
  user-select: none;
  cursor: pointer;
  flex: 1;
  padding: 5px;
  border-radius: 5px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 5px;
  &:hover {
    background-color: var(--box-bg-color);
    box-shadow: 0 0 3px var(--box-shadow-color);
  }
  &:active,
  &.active {
    background-color: var(--box-active-bg-color);
    box-shadow: 0 0 5px var(--box-active-shadow-color);
  }
  .box-main {
    display: flex;
    gap: 5px;
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
    word-break: break-word;
    display: flex;
    align-items: center;
  }
  .box-end {
    flex-shrink: 0;
  }
}
</style>
