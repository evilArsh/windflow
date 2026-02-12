<script lang="ts" setup>
import { DialogPanel } from "@toolmain/components"
import { TooltipTriggerType } from "element-plus"
const { width = 500, trigger = "hover" } = defineProps<{
  width?: number
  trigger?: TooltipTriggerType
}>()
</script>
<template>
  <el-popover placement="top" :width :trigger popper-style="--el-popover-padding: 0">
    <template #reference>
      <slot name="reference"></slot>
    </template>
    <DialogPanel>
      <template v-if="$slots.header" #header>
        <slot name="header"></slot>
      </template>
      <template #default>
        <slot></slot>
      </template>
      <template v-if="$slots.footer" #footer>
        <slot name="footer"></slot>
      </template>
    </DialogPanel>
  </el-popover>
</template>
<style lang="scss" scoped></style>
