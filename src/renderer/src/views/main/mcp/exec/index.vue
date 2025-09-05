<script lang="ts" setup>
import Npm from "./npm.vue"
import Python from "./python.vue"
import useEnvStore from "@renderer/store/env"
const envStore = useEnvStore()

envStore.checkEnv()
</script>
<template>
  <ContentLayout>
    <div class="mx-auto my-1rem max-w-1024px flex flex-col gap1rem">
      <Npm></Npm>
      <Python></Python>
    </div>
  </ContentLayout>
</template>
<style lang="scss" scoped></style>
