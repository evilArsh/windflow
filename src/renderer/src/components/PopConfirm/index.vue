<script lang="ts" setup>
import { CallBackFn } from "@toolmain/shared"
import { refDebounced } from "@vueuse/core"
import { PopoverProps } from "element-plus"

type ButtonType = "" | "text" | "default" | "primary" | "success" | "warning" | "info" | "danger"
type ConfirmCallback = (done: CallBackFn, e: MouseEvent) => void
type CancelCallback = (done: CallBackFn, e: MouseEvent) => void

const props = withDefaults(
  defineProps<
    // eslint-disable-next-line vue/prop-name-casing
    Partial<PopoverProps> & {
      title: string
      confirmButtonText?: string
      confirmButtonType?: ButtonType
      cancelButtonText?: string
      cancelButtonType?: ButtonType
      confirm?: ConfirmCallback
      cancel?: CancelCallback
      size?: "default" | "small" | "large"
    }
  >(),
  {
    confirmButtonText: "confirm",
    confirmButtonType: "danger",
    cancelButtonText: "cancel",
    cancelButtonType: "text",
    size: "small",
    // popover props
    trigger: "hover",
    triggerKeys: () => ["Enter", "Space"],
    effect: "light",
    content: "",
    width: "auto",
    placement: "bottom",
    disabled: false,
    visible: null,
    offset: undefined,
    transition: "",
    showArrow: true,
    popperOptions: () => ({
      modifiers: [
        {
          name: "computeStyles",
          options: {
            gpuAcceleration: false,
          },
        },
      ],
    }),
    confirm: undefined,
    cancel: undefined,
    popperClass: "",
    popperStyle: "",
    showAfter: 0,
    hideAfter: 200,
    autoClose: 0,
    tabindex: 0,
    teleported: true,
    appendTo: "body",
    persistent: true,
  }
)
const pop = shallowReactive({
  visible: false,
  open() {
    pop.visible = true
  },
  close() {
    pop.visible = false
  },
})
const useBtn = () => {
  const disabled = ref(false)
  const loading = ref(false)
  const isConfirmClick = ref(false)
  const isCancelClick = ref(false)
  function done(): void {
    disabled.value = false
    loading.value = false
  }
  function wait() {
    disabled.value = true
    loading.value = true
  }
  function clickConfirm() {
    isConfirmClick.value = true
    isCancelClick.value = false
  }
  function clickCancel() {
    isCancelClick.value = true
    isConfirmClick.value = false
  }
  return {
    disabled,
    loading: refDebounced(loading, 250),
    done,
    wait,
    clickConfirm,
    clickCancel,
    isConfirmClick,
    isCancelClick,
  }
}
const {
  disabled: btnDisabled,
  loading: btnLoading,
  done: btnDone,
  wait: btnWait,
  clickConfirm,
  clickCancel,
  isConfirmClick,
  isCancelClick,
} = useBtn()
const ev = {
  onConfirm(e: MouseEvent) {
    clickConfirm()
    btnWait()
    if (props.confirm) {
      props.confirm(() => {
        btnDone()
        pop.close()
      }, e)
    } else {
      btnDone()
      pop.close()
    }
  },
  onCancel(e: MouseEvent) {
    clickCancel()
    btnWait()
    if (props.cancel) {
      props.cancel(() => {
        btnDone()
        pop.close()
      }, e)
    } else {
      btnDone()
      pop.close()
    }
  },
  onOpen() {
    if (toValue(btnDisabled) || toValue(btnLoading)) {
      return
    }
    pop.open()
  },
}
</script>
<template>
  <el-popover ref="popRef" v-bind="props" :visible="pop.visible" title="">
    <template #reference>
      <span @click="ev.onOpen">
        <slot name="reference" :disabled="btnDisabled" :loading="btnLoading"></slot>
      </span>
    </template>
    <template #default>
      <slot :wait="btnWait">
        <div class="fixed left-0 top-0 right-0 bottom-0 z-2999"></div>
        <ContentBox class="relative z-3000" normal style="--ai-gap-base: 1rem; --content-box-padding: 0">
          <template #header>
            <div class="flex gap-1rem items-center">
              <i class="i-ep-question-filled c-[var(--el-color-warning)] text-1.4rem"></i>
              <el-text :size> {{ title }}</el-text>
            </div>
          </template>
          <div class="flex items-center justify-end">
            <el-button
              :disabled="btnDisabled"
              :loading="btnLoading && isCancelClick"
              :type="cancelButtonType"
              :size
              @click="ev.onCancel">
              {{ cancelButtonText }}
            </el-button>
            <el-button
              :disabled="btnDisabled"
              :loading="btnLoading && isConfirmClick"
              :type="confirmButtonType"
              :size
              @click="ev.onConfirm">
              {{ confirmButtonText }}
            </el-button>
          </div>
        </ContentBox>
      </slot>
    </template>
  </el-popover>
</template>
