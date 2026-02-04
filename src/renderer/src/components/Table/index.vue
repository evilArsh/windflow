<script lang="ts" generic="T extends DefaultRow" setup>
import { CSSProperties } from "@toolmain/shared"
import { DefaultRow, CombineTableProps } from "./types"
import { DialogPanel } from "@toolmain/components"

import { defaultTableProps } from "./vars"
const { t } = useI18n()
const emit = defineEmits<{
  "update:page-size": [number]
  "update:current-page": [number]
  change: [currentPage: number, pageSize: number]
}>()

const props = withDefaults(
  defineProps<{
    data: T[]
    /**
     * pagination total
     */
    total?: number
    /**
     * pagination size
     */
    pageSize?: number
    /**
     * pagination limit
     */
    currentPage?: number
    loading?: boolean
    tableClass?: string
    tableStyle?: CSSProperties
    tableProps?: CombineTableProps
  }>(),
  {
    loading: false,
    total: 0,
    currentPage: 1,
    pageSize: 20,
    tableClass: "",
    tableStyle: () => ({}),
    tableProps: () =>
      defaultTableProps({
        highlightCurrentRow: true,
        stripe: true,
        border: false,
      }),
  }
)
const pageSize = computed({
  get: () => props.pageSize,
  set: val => emit("update:page-size", val),
})
const currentPage = computed({
  get: () => props.currentPage,
  set: val => emit("update:current-page", val),
})
</script>
<template>
  <DialogPanel class="custom-table" style="--dialog-scroll-view-padding: 0">
    <template #default>
      <el-table
        :empty-text="t('tip.noContent')"
        v-loading="loading"
        :data
        :class="tableClass"
        :style="tableStyle"
        v-bind="tableProps">
        <template v-if="$slots.default" #default>
          <slot></slot>
        </template>
        <template v-if="$slots.append" #append>
          <slot name="append"></slot>
        </template>
        <template #empty>
          <slot name="empty">
            <el-empty></el-empty>
          </slot>
        </template>
      </el-table>
    </template>
    <template v-if="$slots.footer || total" #footer>
      <slot name="footer"></slot>
      <div>
        <el-pagination
          v-model:page-size="pageSize"
          v-model:current-page="currentPage"
          @change="(a, b) => emit('change', a, b)"
          background
          layout="total,sizes,prev,pager,next,jumper"
          :total />
      </div>
    </template>
  </DialogPanel>
</template>
<style lang="scss" scoped>
.custom-table {
  --el-card-border-color: transparent;
  width: 100%;
  height: 100%;
}
</style>
