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
const editorRef = shallowRef<HTMLDivElement>()
const { create, dispose, ev, onValueChange, onLangChange, onFilenameChange, onNameSpaceChange } = useEditor()
ctx.initEnv(ev)

watch(
  () => props.value,
  () => onValueChange(props)
)
watch(
  () => props.lang,
  () => onLangChange(props)
)
watch(
  () => props.filename,
  () => onFilenameChange(props)
)
watch(
  () => props.namespace,
  () => onNameSpaceChange(props)
)
onMounted(() => {
  ev.emit("mounted")
  const propsRaw = toRaw(props)
  ev.on("change", (code: string) => emit("change", code))
  editorRef.value && create(editorRef.value, propsRaw)
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
