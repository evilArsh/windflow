<script lang="ts" setup>
import { CallBackFn } from "@toolmain/shared"
import { PopconfirmProps, ElTooltipProps } from "element-plus"
import QuestionFilled from "~icons/ep/question-filled"
const props = withDefaults(
  defineProps<
    Partial<PopconfirmProps> & {
      size?: "default" | "small" | "large"
    }
  >(),
  {
    effect: "light",
    "confirm-button-type": "primary",
    "cancel-button-type": "text",
    icon: () => h(QuestionFilled),
    "icon-color": "#f90",
    "hide-icon": false,
    "hide-after": 200,
    teleported: true,
    persistent: false,
    width: 150,
    size: "small",
  }
)
const emit = defineEmits<{
  confirm: [done: CallBackFn, e: MouseEvent]
  cancel: [e: MouseEvent]
}>()
const useBtn = () => {
  const disabled = ref(false)
  const loading = ref(false)
  function done(): void {
    disabled.value = false
    loading.value = false
  }
  function wait() {
    disabled.value = true
    loading.value = true
  }
  return { disabled, loading, done, wait }
}
const { disabled, loading, done, wait } = useBtn()
const tooltip = ref<Partial<ElTooltipProps>>({
  visible: false,
})
function evConfirm(e: MouseEvent, confirm: (e: MouseEvent) => void) {
  wait()
  emit(
    "confirm",
    () => {
      done()
      confirm(e)
    },
    e
  )
}
function evCancel(e: MouseEvent, cancel: (e: MouseEvent) => void) {
  wait()
  emit("cancel", e)
  cancel(e)
  done()
}
function onConfirm() {
  console.log("onConfirm")
}
function onCancel() {
  console.log("onCancel")
}
</script>
<template>
  <el-popconfirm v-bind="props" :tooltip @confirm="onConfirm" @cancel="onCancel">
    <template #reference>
      <span>
        <slot></slot>
      </span>
    </template>
    <template #actions="{ cancel, confirm }">
      <div class="flex justify-between">
        <el-button :disabled :type="cancelButtonType" :size @click="e => evCancel(e, cancel)">
          <span :size v-if="!loading">
            {{ cancelButtonText }}
          </span>
          <i v-else class="i-ep:loading loading-icon"></i>
        </el-button>
        <el-button :disabled :type="confirmButtonType" :size @click="e => evConfirm(e, confirm)">
          <span :size v-if="!loading">
            {{ confirmButtonText }}
          </span>
          <i v-else class="i-ep:loading loading-icon"></i>
        </el-button>
      </div>
    </template>
  </el-popconfirm>
</template>
<style lang="scss" scoped>
.loading-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
