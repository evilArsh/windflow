<script lang="ts" setup>
import { CSSProperties } from "@renderer/lib/shared/types"

const {
  wrapStyle = {},
  mainStyle = {},
  describe = "",
  defaultLock = false,
  needLock = false,
  stillLock = false,
  background = false,
} = defineProps<{
  wrapStyle?: CSSProperties
  mainStyle?: CSSProperties
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

const boxShadowColor = ref("rgba(0, 0, 0, 0.1)")
const activeShadowColor = ref("rgba(0, 0, 0, 0.2)")
const bgColor = computed(() => (background ? unref(boxShadowColor) : "unset"))
const activeBgColor = computed(() => (background ? unref(activeShadowColor) : "unset"))
const locked = ref(false)
const active = ref(false)
const boxStyle = computed<CSSProperties>(() => {
  return {
    "--box-shadow-color": unref(boxShadowColor),
    "--box-active-shadow-color": unref(activeShadowColor),
    "--box-bg-color": unref(bgColor),
    "--box-active-bg-color": unref(activeBgColor),
  }
})
const handle = {
  toggleLock: (toggle?: boolean) => {
    if (stillLock) return
    if (!needLock) return
    locked.value = toggle ?? !locked.value
    emit("lock", locked.value)
  },
  click: () => {
    handle.toggleLock()
  },
}
watch(
  () => defaultLock,
  v => {
    active.value = v
  }
)
</script>
<template>
  <el-tooltip
    size="small"
    effect="light"
    :content="describe"
    placement="top"
    :show-arrow="false"
    :show-after="500"
    :disabled="!describe">
    <div class="box" :class="{ active: active }" :style="[boxStyle, wrapStyle]" @click.stop="handle.click">
      <div class="box-main" :style="mainStyle">
        <div v-if="$slots.icon" class="box-icon"><slot name="icon"></slot></div>
        <div class="box-text"><slot> </slot></div>
        <div v-if="$slots.end" class="box-end"><slot name="end"></slot></div>
      </div>
      <div v-if="$slots.footer" class="box-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </el-tooltip>
</template>
<style lang="scss" scoped>
%active {
  background-color: var(--box-active-bg-color);
  box-shadow: 0 0 3px var(--box-active-shadow-color);
}
.box {
  --box-shadow-color: rgba(0, 0, 0, 0.1);
  --box-active-shadow-color: rgba(0, 0, 0, 0.2);
  user-select: none;
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
  &:active {
    @extend %active;
  }
  &.active {
    @extend %active;
  }
  .box-main {
    display: flex;
    gap: 8px;
    align-items: center;
    cursor: pointer;
  }
  .box-icon {
    flex-shrink: 0;
  }
  .box-text {
    flex: 1;
    white-space: normal;
    word-break: break-word;
  }
  .box-end {
    flex-shrink: 0;
  }
}
</style>
