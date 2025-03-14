<template>
  <div class="h_icon" :class="{ active: data.lock }" @click="hdl.lock">
    <el-tooltip
      size="small"
      effect="light"
      :content="describe"
      placement="top"
      :show-arrow="false"
      :show-after="1500"
      :disabled="!describe">
      <slot></slot>
    </el-tooltip>
  </div>
</template>
<script lang="ts" setup>
const { defaultLock = false, needLock = false } = defineProps<{
  /**
   * 默认保持按下状态
   */
  defaultLock?: boolean
  /**
   * 当按下时是否需要保持
   */
  needLock?: boolean
  /**
   * hover时显示描述
   */
  describe?: string
}>()
const emit = defineEmits<{
  /**
   * 按下时触发，并改变锁定状态
   * @param status 锁定状态
   */
  lock: [status: boolean]
}>()
const data = reactive({
  lock: defaultLock,
})
const hdl = {
  lock: () => {
    if (!needLock) return
    data.lock = !data.lock
    emit("lock", data.lock)
  },
}
onMounted(() => {
  emit("lock", data.lock)
})
</script>
<style lang="scss" scoped>
.h_icon {
  user-select: none;
  padding: 4px;
  transition: all 0.3s ease;
  font-size: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  &.active {
    background-color: rgba(0, 0, 0, 0.1);
  }
  &:hover {
    cursor: pointer;
    background-color: rgba(0, 0, 0, 0.1);
  }
  &:active {
    background-color: rgba(0, 0, 0, 0.2);
  }
}
</style>
