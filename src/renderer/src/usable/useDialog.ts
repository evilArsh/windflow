import { DialogEmits, DialogProps } from "element-plus"

type Writable<T> = {
  -readonly [K in keyof T]: T[K]
}
export default function (preset?: Partial<Writable<DialogProps>>) {
  const data = ref<Partial<Writable<DialogProps>>>({
    modelValue: false,
    title: "",
    width: "50%",
    appendToBody: true,
    destroyOnClose: true,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    lockScroll: true,
    modal: true,
    center: false,
    draggable: true,
    overflow: true,
    showClose: false,
  })
  if (preset) {
    Object.assign(data.value, preset)
  }
  const event = ref<DialogEmits>({
    open: (): boolean => true,
    opened: (): boolean => true,
    close: (): boolean => true,
    closed: (): boolean => true,
    "update:modelValue": (value: boolean): boolean => {
      data.value.modelValue = value
      return true
    },
    openAutoFocus: (): boolean => true,
    closeAutoFocus: (): boolean => true,
  })
  function open() {
    data.value.modelValue = true
  }
  function close() {
    data.value.modelValue = false
  }
  return {
    dlgProps: data,
    dlgEvent: event,
    open,
    close,
  }
}
