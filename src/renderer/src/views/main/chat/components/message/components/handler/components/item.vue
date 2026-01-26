<script setup lang="ts">
defineProps<{
  title: string
  iconClass?: string
}>()
</script>
<template>
  <ContentBox class="setting-box">
    <template #icon>
      <i class="text-1.6rem" :class="[iconClass]"></i>
    </template>
    <template #default>
      <div class="flex flex-1 items-center justify-between gap[var(--ai-gap-large)]">
        <div class="flex-shrink-0">
          <el-text>{{ title }}</el-text>
        </div>
        <div class="flex-1 flex w-full items-center justify-end">
          <slot> </slot>
        </div>
      </div>
    </template>
    <template #end>
      <slot name="end">
        <i-material-symbols-help-outline class="c-transparent"></i-material-symbols-help-outline>
      </slot>
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer"></slot>
    </template>
  </ContentBox>
</template>
<style lang="scss" scoped>
@use "./common.scss";
</style>
