<script setup lang="ts">
import useParser from "./worker"
import CodeBlock from "./components/CodeBlock/index.vue"
const emit = defineEmits<{
  "update:modelValue": [string]
}>()
const props = defineProps<{
  contentClass?: string
  modelValue: string
}>()
const content = computed({
  get: () => props.modelValue,
  set: value => emit("update:modelValue", value),
})

const { html, parse, destroy, init } = useParser({
  code: CodeBlock,
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
    <div class="w-full" :class="[contentClass]">
      <component :is="html"></component>
    </div>
  </div>
</template>
<style lang="scss">
@use "./index.scss";
</style>
