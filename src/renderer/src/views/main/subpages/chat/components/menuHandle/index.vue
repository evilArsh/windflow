<script setup lang="ts">
import { type CallBackFn } from "@renderer/lib/shared/types"
const emit = defineEmits<{
  (e: "edit", event: MouseEvent): void
  (e: "delete", done: CallBackFn, event: MouseEvent): void
  (e: "add", done: CallBackFn, event: MouseEvent): void
}>()
const props = defineProps<{
  /**
   * 获得焦点
   */
  focus: boolean
}>()
const { t } = useI18n()
const deleteConfirm = ref(false)
const menuRef = useTemplateRef<HTMLElement>("menu")

const reset = () => {
  deleteConfirm.value = false
}
watch(
  () => props.focus,
  v => {
    !v && reset()
  }
)
const onEdit = (event: MouseEvent) => {
  emit("edit", event)
}
const onDelete = (done: CallBackFn, event: MouseEvent) => {
  emit(
    "delete",
    () => {
      done()
      deleteConfirm.value = false
    },
    event
  )
}
const onAdd = (done: CallBackFn, event: MouseEvent) => {
  emit("add", done, event)
}
defineExpose({
  bounding: () => {
    return menuRef.value?.getBoundingClientRect()
  },
})
</script>
<template>
  <div ref="menu" class="w-100% h-100%">
    <el-card style="--el-card-padding: 0" class="w-100%">
      <div class="menu-handle">
        <el-button text @click.stop="onEdit">
          <div class="handle-item">
            <i-ep:edit></i-ep:edit>
            <span>{{ t("btn.edit") }}</span>
          </div>
        </el-button>
        <Button text @click="(done, e) => onAdd(done, e)">
          <div class="handle-item">
            <i-ep:plus></i-ep:plus>
            <span>{{ t("btn.add") }}</span>
          </div>
        </Button>
        <el-button v-if="!deleteConfirm" @click.stop="deleteConfirm = true" text type="default">
          <div class="handle-item">
            <i-ep:delete></i-ep:delete>
            <span>{{ t("btn.delete") }}</span>
          </div>
        </el-button>
        <Button v-else text type="danger" @click="(done, e) => onDelete(done, e)"> 确认删除? </Button>
      </div>
    </el-card>
  </div>
</template>
<style lang="scss" scoped>
.menu-handle {
  display: flex;
  flex-direction: column;
  width: 100%;
  :deep(.el-button) {
    & + .el-button {
      margin-left: 0;
    }
    & > span {
      width: 100%;
    }
  }
  .handle-item {
    display: flex;
    align-items: center;
    gap: var(--ai-gap-base);
    width: 100%;
  }
}
</style>
