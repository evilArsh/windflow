<script lang="ts" setup></script>
<template>
  <Abbrs
    :data="[
      { data: '文', type: 'text' },
      { data: '字', type: 'text' },
      { data: '测', type: 'text' },
      { data: '试', type: 'text' },
    ]"></Abbrs>
  <div class="flex">
    <span class="fold1 p-5px bg-amber c-#fff" border="solid 1px rd-50% red">文</span>
    <span class="fold2 p-5px bg-amber c-#fff" border="solid 1px rd-50% red">字</span>
    <span class="fold3 p-5px bg-amber c-#fff" border="solid 1px rd-50% red">测</span>
    <span class="fold4 p-5px bg-amber c-#fff" border="solid 1px rd-50% red">试</span>
  </div>
</template>
<style lang="scss" scoped>
.fold1 {
  transform: translateX(0px);
}
.fold2 {
  transform: translateX(-10px);
}
.fold3 {
  transform: translateX(-20px);
}
.fold4 {
  transform: translateX(-30px);
}
</style>
