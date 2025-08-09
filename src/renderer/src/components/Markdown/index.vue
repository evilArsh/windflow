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

const edit = shallowReactive({
  show: false,
  open: () => (edit.show = true),
  close: () => (edit.show = false),
  toggle: () => (edit.show = !edit.show),
  onConfirm(value: string) {
    content.value = value
    emit("change", value)
    edit.close()
  },
})

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
</script>
<template>
  <div class="markdown-container">
    <Handler v-if="editable" @toggle-edit="edit.toggle"></Handler>
    <Input v-if="edit.show" :content="content" @confirm="edit.onConfirm" @cancel="edit.close"></Input>
    <component v-else :is="html"></component>
  </div>
</template>
<style lang="scss">
@use "./index.scss";
</style>
