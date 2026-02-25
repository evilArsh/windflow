<script lang="ts" setup>
import { CallBackFn, CSSProperties } from "@toolmain/shared"
import { Spinner } from "@toolmain/components"

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
  disabled = false,
  loading = false,
  button = false,
  textLoading = true,
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
   * button模式下 `disabled` `loading` `textLoading` 生效
   */
  button?: boolean
  /**
   * 是否禁用，button 模式下生效
   */
  disabled?: boolean
  /**
   * loading 状态，button 模式下生效
   */
  loading?: boolean
  /**
   * loading状态下是否显示文本，button 模式下生效
   */
  textLoading?: boolean
}>()
const emit = defineEmits<{
  /**
   * 按下时触发，并改变锁定状态
   * @param status 锁定状态
   */
  lock: [status: boolean]
  iconClick: [e: MouseEvent]
  click: [e: MouseEvent, done?: CallBackFn]
}>()
const active = ref(false)

const _disabled = ref(false)
const _loading = ref(false)
const finalDisabled = computed(() => (button ? disabled || _disabled.value : false))
const finalLoading = computed(() => (button ? loading || _loading.value : false))
// always true under non-button mode, otherwise, only show when [no loading] or [loading but show text]
const slotShow = computed(() => (button ? !finalLoading.value || (finalLoading.value && textLoading) : true))
function done(): void {
  _disabled.value = false
  _loading.value = false
}

const handle = {
  toggleLock: (toggle?: boolean) => {
    if (stillLock) return
    if (!needLock) return
    active.value = toggle ?? !active.value
    emit("lock", active.value)
  },
  click: (e: MouseEvent) => {
    if (finalDisabled.value) return
    handle.toggleLock()
    if (button) {
      _disabled.value = true
      _loading.value = true
      emit("click", e, done)
    } else {
      emit("click", e)
    }
  },
  iconClick: (e: MouseEvent) => {
    if (finalDisabled.value) return
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
    :class="[{ active, normal, background, round, disabled: finalDisabled }, wrapClass]"
    :style="wrapStyle"
    @click="handle.click">
    <div v-if="$slots.header && !button" class="box-header">
      <slot name="header"></slot>
    </div>
    <div class="box-main" :style="mainStyle" :class="[mainClass]">
      <div v-if="!$slots.icon && finalLoading" @click="handle.iconClick" class="box-icon">
        <Spinner class="text-1.4rem" :model-value="true"></Spinner>
      </div>
      <div v-else-if="$slots.icon" @click="handle.iconClick" class="box-icon" :class="{ 'normal-icon': normalIcon }">
        <slot v-if="!finalLoading" name="icon"></slot>
        <Spinner v-else class="text-1.4rem" :model-value="finalLoading"></Spinner>
      </div>
      <div v-if="$slots.default && slotShow" class="box-text"><slot> </slot></div>
      <div v-if="$slots.end && slotShow" class="box-end"><slot name="end"></slot></div>
    </div>
    <div v-if="$slots.footer && !button" class="box-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.comp-content-box {
  --box-padding: var(--ai-gap-small);
  --box-margin: 0;

  --box-text-color: var(--el-text-color-regular);
  --box-text-active-color: var(--el-text-color-regular);
  --box-text-hover-color: var(--el-text-color-regular);

  --box-border-radius: 5px;
  --box-border-color: transparent;
  --box-border-hover-color: transparent;
  --box-border-active-color: transparent;
  --box-border-size: 0;

  --box-shadow: 0 0 3px var(--el-fill-color-lighter);
  --box-shadow-active: 0 0 5px var(--el-fill-color-light);

  --box-bg-color: transparent;
  --box-bg-hover-color: var(--el-color-info-light-7);
  --box-bg-active-color: var(--el-color-info-light-5);

  --box-icon-color: var(--el-text-color-regular);
  --box-icon-hover-color: var(--el-color-primary-light-7);
  --box-icon-active-color: var(--el-color-primary-light-5);

  &.background {
    --box-bg-color: var(--el-color-info-light-8);
  }
  &.normal {
    --box-shadow: none;
    --box-shadow-active-color: none;
    --box-bg-color: transparent;
    --box-bg-hover-color: transparent;
    --box-bg-active-color: transparent;
  }
  &.disabled {
    cursor: not-allowed;
    --box-shadow: none;
    --box-shadow-active: none;

    --box-border-color: var(--el-disabled-border-color);
    --box-border-active-color: var(--el-disabled-border-color);
    --box-border-hover-color: var(--el-disabled-border-color);

    --box-bg-color: var(--el-disabled-bg-color);
    --box-bg-hover-color: var(--el-disabled-bg-color);
    --box-bg-active-color: var(--el-disabled-bg-color);

    --box-icon-color: var(--el-text-color-disabled);
    --box-icon-hover-color: var(--el-disabled-bg-color);
    --box-icon-active-color: var(--el-disabled-bg-color);

    --box-text-color: var(--el-text-color-disabled);
    --box-text-active-color: var(--el-text-color-disabled);
    --box-text-hover-color: var(--el-text-color-disabled);
  }
}
.comp-content-box {
  -webkit-app-region: no-drag;
  user-select: none;
  cursor: pointer;
  font-size: var(--el-font-size-base);
  color: var(--box-text-color);
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
  &:hover {
    background-color: var(--box-bg-hover-color);
    box-shadow: var(--box-shadow);
    border-color: var(--box-border-hover-color);
    color: var(--box-text-hover-color);
  }
  &:active,
  &.active {
    background-color: var(--box-bg-active-color);
    box-shadow: var(--box-shadow-active);
    border-color: var(--box-border-active-color);
    color: var(--box-text-active-color);
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
