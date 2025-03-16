<script lang="ts" setup></script>
<template>
  <div class="subnav-container">
    <div class="subnav-provider">
      <slot name="submenu"></slot>
    </div>
    <div class="subnav-content">
      <slot name="content"></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.subnav-container {
  --subnav-container-bg-color: transparent;
  --subnav-container-provider-bg-color: #efefef;
  --subnav-container-provider-padding: 0.25rem;
  --subnav-container-content-bg-color: #fdfdfd;

  flex: 1;
  display: flex;
  overflow: hidden;
  background-color: var(--subnav-container-bg-color);
  .subnav-provider {
    overflow: hidden;
    width: 25rem;
    background-color: var(--subnav-container-provider-bg-color);
    display: flex;
    flex-direction: column;
    padding: var(--subnav-container-provider-padding);
  }
  .subnav-content {
    flex-shrink: 0;
    background-color: var(--subnav-container-content-bg-color);
    overflow: hidden;
    display: flex;
    flex: 1;
  }
}
</style>
