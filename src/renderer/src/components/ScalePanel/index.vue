<template>
  <Base
    ref="base"
    v-model="config"
    :target
    @mounted="hooks.onBaseMounted"
    @moving="hooks.onMoving"
    @before-move="hooks.onBeforeMove"
    @after-move="hooks.onAfterMove"
    @after-scale="hooks.onAfterScale"
    @scaling="hooks.onScaling">
    <template #toolbar="toolbar">
      <div class="toolbar">
        <ToolBar
          :config="config"
          :handle="handle"
          :scale="toolbar.scale"
          :move="toolbar.move"
          :drag-offset="toolbar.dragOffset">
          <slot name="toolbar"></slot>
        </ToolBar>
      </div>
    </template>
    <template #resize="resize">
      <Resize :config="config" :handle="handle" :scale="resize.scale" :move="resize.move"></Resize>
    </template>
    <template #default>
      <slot
        :config="config"
        :handle="handle"
        :scale="baseMountedParams?.scale"
        :move="baseMountedParams?.move"
        :drag-offset="baseMountedParams?.dragOffset"></slot>
    </template>
  </Base>
</template>
<script lang="ts" setup>
import Base from "./base.vue"
import {
  type ScaleProps,
  type ScaleConfig,
  type ScaleInstance,
  type AnimateDir,
  type BaseMountedParams,
  type MoveHook,
  type MoveEvent,
} from "./types"
import useHandle, { Status } from "./useHandle"
import { useDebounceFn } from "@vueuse/core"
import ToolBar from "./plugins/toolbar/index.vue"
import Resize from "./plugins/resize/index.vue"
import { useDragOffset } from "./helper"
import { type Ref } from "vue"
const emit = defineEmits<{
  moving: [pos: MoveEvent]
  beforeMove: [pos: MoveEvent]
  afterMove: [pos: MoveEvent]
  afterScale: [data: HTMLElement]
  scaling: [data: HTMLElement]
  mounted: [data: BaseMountedParams]
  "update:modelValue": [data: ScaleConfig]
}>()
const { modelValue, target } = defineProps<ScaleProps>()
const config = computed({
  get: () => modelValue,
  set(v) {
    emit("update:modelValue", v)
  },
})
const handle: Ref<ReturnType<typeof useHandle> | undefined> = ref()
const baseMountedParams = ref<BaseMountedParams>()
const tools = {
  autoStick: useDebounceFn(
    async () => {
      if (config.value.autoStick) {
        await nextTick()
        if (typeof config.value.autoStick === "boolean") {
          await handle.value?.autoStick(true)
        } else {
          await handle.value?.stickTo(config.value.autoStick, true)
        }
      }
    },
    200,
    { maxWait: 1000 }
  ),
}
const hooks = {
  onAfterScale: async (scaleEl: HTMLElement) => {
    await tools.autoStick()
    emit("afterScale", scaleEl)
  },
  onScaling: (scaleEl: HTMLElement) => {
    emit("scaling", scaleEl)
  },
  onAfterMove: async (pos: MoveEvent) => {
    await tools.autoStick()
    emit("afterMove", pos)
  },
  onMoving: (pos: MoveEvent) => {
    emit("moving", pos)
  },
  onBeforeMove: (pos: MoveEvent) => {
    emit("beforeMove", pos)
  },
  onBaseMounted: async (data: BaseMountedParams): Promise<void> => {
    const { setScale } = useDragOffset(data.dragOffset)
    handle.value = useHandle({
      config,
      targetEle: data.drag,
      dragOffset: data.dragOffset,
    })
    handle.value.setStatus(Status.NORMAL)
    const hideFirst = config.value.hideFirst
    if (hideFirst) {
      if (hideFirst === true) {
        await handle.value.autoHide(false)
      } else {
        await handle.value.hideTo(hideFirst, false)
      }
    } else if (config.value.minFirst) {
      await handle.value.min(false)
    } else {
      if (config.value.maxFirst) {
        await handle.value.max(false)
      }
      setScale(1, 1)
    }
    data.handle = handle.value
    baseMountedParams.value = data
    await nextTick()
    emit("mounted", data)
  },
}
defineExpose<ScaleInstance>({
  async autoStick(animate) {
    await nextTick()
    await handle.value?.autoStick(animate)
  },
  async stickTo(dir, animate) {
    await nextTick()
    await handle.value?.stickTo(dir, animate)
  },
  async hideTo(dir, animate) {
    await nextTick()
    await handle.value?.hideTo(dir, animate)
  },
  async autoHide(animate) {
    await nextTick()
    await handle.value?.autoHide(animate)
  },
  async show(animate, dir?: AnimateDir) {
    await nextTick()
    await handle.value?.show(animate, dir)
  },
  async min(animate: boolean) {
    await nextTick()
    await handle.value?.min(animate)
  },
  async max(animate: boolean) {
    await nextTick()
    await handle.value?.max(animate)
  },
  async minReverse(animate: boolean) {
    await nextTick()
    await handle.value?.minReverse(animate)
  },
  async maxReverse(animate: boolean) {
    await nextTick()
    await handle.value?.maxToNormal(animate)
  },
  async moveTo(animate: boolean, dir: AnimateDir, hooks?: MoveHook) {
    await nextTick()
    await handle.value?.moveTo(animate, dir, hooks)
  },
  getStatus: function (): Status | undefined {
    return handle.value?.getStatus()
  },
})
onMounted(() => {
  window.addEventListener("resize", tools.autoStick)
})
onBeforeUnmount(() => {
  window.removeEventListener("resize", tools.autoStick)
  handle.value?.onBeforeUnmount()
})
</script>
<style lang="scss" scoped>
.toolbar {
  display: flex;
  align-items: center;
}
</style>
