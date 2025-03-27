<script setup lang="ts">
const emit = defineEmits<{
  (e: "edit", event: MouseEvent): void
  (e: "delete", event: MouseEvent): void
  (e: "add", event: MouseEvent): void
}>()
const props = defineProps<{
  /**
   * 获得焦点
   */
  focus: boolean
}>()
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
const onDelete = (event: MouseEvent) => {
  emit("delete", event)
  deleteConfirm.value = false
}
const onAdd = (event: MouseEvent) => {
  emit("add", event)
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
            <span>编辑</span>
          </div>
        </el-button>
        <el-button text @click.stop="onAdd">
          <div class="handle-item">
            <i-ep:plus></i-ep:plus>
            <span>新增</span>
          </div>
        </el-button>
        <el-button text :type="deleteConfirm ? 'danger' : 'default'">
          <div v-if="!deleteConfirm" @click.stop="deleteConfirm = true" class="handle-item">
            <i-ep:delete></i-ep:delete>
            <span>删除</span>
          </div>
          <div v-else class="handle-item" @click.stop="onDelete">
            <span>确认删除?</span>
          </div>
        </el-button>
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
    & > span {
      width: 100%;
    }
  }
  .handle-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }
}
</style>
