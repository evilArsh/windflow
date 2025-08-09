<script setup lang="ts">
defineEmits<{
  edit: []
}>()
</script>
<template>
  <ContentBox class="absolute right-0 top-0 z-999">
    <div class="flex items-center">
      <el-button size="small" circle plain text type="primary" @click="$emit('edit')">
        <i-solar:clapperboard-edit-broken class="text-1.4rem"></i-solar:clapperboard-edit-broken>
      </el-button>
    </div>
  </ContentBox>
</template>
<style lang="scss" scoped></style>
