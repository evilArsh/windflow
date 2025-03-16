<template>
  <div class="provider-container">
    <Hover v-for="item in providers" :key="item.name">
      <el-card class="card" shadow="never" @click="editForm = item">
        <div class="card-body">
          <el-image class="icon" :src="item.logo" />
          <el-text class="name">{{ item.name }}</el-text>
        </div>
      </el-card>
    </Hover>
  </div>
</template>
<script lang="ts" setup>
import useProviderStore from "@renderer/pinia/provider.store"
import { storeToRefs } from "pinia"
const providerStore = useProviderStore()
const { providers, editForm } = storeToRefs(providerStore)
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
