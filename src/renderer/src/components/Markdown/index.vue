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

const edit = shallowReactive({
  show: false,
  open: () => {
    if (content.value) {
      edit.show = true
    }
  },
  close: () => (edit.show = false),
  toggle: () => {
    if (!edit.show) {
      edit.open()
    } else {
      edit.close()
    }
  },
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
defineExpose({
  toggleEdit: edit.toggle,
})
</script>
<template>
  <div class="markdown-container">
    <Handler v-show="editable && content && showHandler" @toggle-edit="edit.toggle"></Handler>
    <Input v-if="edit.show" :content="content" @confirm="edit.onConfirm" @cancel="edit.close"></Input>
    <div v-else class="w-full" :class="[contentClass]">
      <component :is="html"></component>
    </div>
  </div>
</template>
<style lang="scss">
@use "./index.scss";
</style>
