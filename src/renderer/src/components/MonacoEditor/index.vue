<template>
  <div ref="editorRef" class="editor"></div>
</template>
<script lang="ts" setup>
import * as ctx from "./libs/index"
import { type EditorProps } from "./types"
import useEditor from "./useEditor"
const props = withDefaults(defineProps<EditorProps>(), {
  namespace: "src",
  readonly: false,
  disposeModel: false,
})
const emit = defineEmits<{
  change: [data: string]
}>()
const editorRef = ref<HTMLDivElement>()
const { create, dispose, ev, onValueChange, onLangChange, onFilenameChange, onNameSpaceChange } = useEditor()
ctx.initEnv(ev)

watch(
  () => props.value,
  () => onValueChange({ ...toRaw(props) })
)
watch(
  () => props.lang,
  () => onLangChange({ ...toRaw(props) })
)
watch(
  () => props.filename,
  () => onFilenameChange({ ...toRaw(props) })
)
watch(
  () => props.namespace,
  () => onNameSpaceChange({ ...toRaw(props) })
)
onMounted(async () => {
  await nextTick()
  ev.emit("mounted")
  const propsRaw = toRaw(props)
  ev.on("change", (code: string) => emit("change", code))
  setTimeout(() => {
    editorRef.value && create(editorRef.value, propsRaw)
  }, 0)
})
onBeforeUnmount(() => {
  ev.emit("beforeUnmount")
  dispose(props)
})
</script>
<style lang="scss" scoped>
.editor {
  position: relative;
  height: 100%;
  width: 100%;
}
</style>
