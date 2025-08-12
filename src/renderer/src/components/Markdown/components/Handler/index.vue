<script setup lang="ts">
defineEmits<{
  toggleEdit: []
}>()
</script>
<template>
  <div class="flex bg-[var(--el-fill-color-lighter)] mb-1rem">
    <ContentBox>
      <div class="flex items-center">
        <el-button size="small" circle plain text type="primary" @click="$emit('toggleEdit')">
          <i-solar:clapperboard-edit-broken class="text-1.4rem"></i-solar:clapperboard-edit-broken>
        </el-button>
      </div>
    </ContentBox>
  </div>
</template>
<style lang="scss" scoped></style>
