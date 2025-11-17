<script setup lang="ts">
import useParser from "./worker"
import CodeBlock from "./components/CodeBlock/index.vue"
import Handler from "./components/Handler/index.vue"
import Input from "./components/Input/index.vue"
const emit = defineEmits<{
  "update:modelValue": [string]
  change: [string]
}>()
const props = defineProps<{
  contentClass?: string
  showHandler?: boolean
  editable?: boolean
  modelValue: string
}>()
const content = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value),
})

const { html, parse, destroy, init } = useParser({
  code: CodeBlock,
})
const useEdit = () => {
  const show = ref(false)
  function open() {
    if (content.value) {
      show.value = true
    }
  }
  function close() {
    show.value = false
  }
  function toggle() {
    if (!show.value) {
      open()
    } else {
      close()
    }
  }
  function onConfirm(value: string) {
    content.value = value
    emit("change", value)
    close()
  }
  return { show: readonly(show), open, close, toggle, onConfirm }
}
const edit = useEdit()

function handleContent(content: string) {
  if (!content) {
    html.value = h("span", "")
    return
  }
  parse(content)
}
watch(content, handleContent)
onMounted(() => {
  init()
  handleContent(content.value)
})
onBeforeUnmount(destroy)
defineExpose({
  toggleEdit: edit.toggle,
})
</script>
<template>
  <div class="markdown-container">
    <Handler v-show="editable && content && showHandler" @toggle-edit="edit.toggle"></Handler>
    <Input v-if="toValue(edit.show)" :content="content" @confirm="edit.onConfirm" @cancel="edit.close"></Input>
    <div v-else class="w-full" :class="[contentClass]">
      <component :is="html"></component>
    </div>
  </div>
</template>
<style lang="scss">
@use "./index.scss";
</style>
