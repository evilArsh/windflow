<template>
  <div class="provider-container">
    <Hover v-for="item in 1" :key="item">
      <el-card class="card" shadow="never">
        <div class="card-body">
          <el-image class="icon" :src="ds" />
          <el-text class="name">DeepSeek</el-text>
        </div>
      </el-card>
    </Hover>
  </div>
</template>
<script lang="ts" setup>
import ds from "@renderer/assets/images/provider/deepseek.svg"
</script>
<style lang="scss" scoped>
.provider-container {
  --provider-container-padding: 0.5rem;
  --provider-container-icon-size: 3rem;
  padding: var(--provider-container-padding);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  .card {
    --el-card-padding: 0.3rem;
    --el-border-color-light: transparent;
    display: flex;
    align-items: center;
    .card-body {
      display: flex;
      align-items: center;
      gap: 1rem;
      .icon {
        width: var(--provider-container-icon-size);
        height: var(--provider-container-icon-size);
      }
      .name {
        font-size: 1.2rem;
      }
    }
  }
}
</style>
