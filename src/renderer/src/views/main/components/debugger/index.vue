<script lang="ts" setup>
import { ScaleConfig } from "@renderer/components/ScalePanel/types"

const scaleRef = useTemplateRef("scale")
const headerRef = useTemplateRef<HTMLDivElement>("header")
const panelConfig = reactive<ScaleConfig>({
  containerStyle: {
    zIndex: z.FIXED,
    position: "fixed",
    width: window.innerWidth * 0.5,
    height: window.innerHeight * 0.6,
    left: 0,
    top: 0,
    overflow: "auto",
    boxShadow: "var(--el-box-shadow-light)",
    backgroundColor: "var(--el-bg-color)",
    minWidth: "20rem",
    minHeight: "20rem",
  },
  visible: false,
  movable: true,
  scalable: true,
})
const db = shallowReactive({
  toggle() {
    if (scaleRef.value?.getStatus() === "NORMAL") {
      scaleRef.value?.hideTo("center", true)
    } else {
      scaleRef.value?.show(true, "center")
    }
  },
})
</script>
<template>
  <div class="handler flex-y-center">
    <ContentBox @click="db.toggle">
      <i-ic:round-terminal class="text-1.8rem"></i-ic:round-terminal>
    </ContentBox>
    <ScalePanel v-model="panelConfig" ref="scale" :drag-target="headerRef">
      <el-card style="--el-card-padding: 1rem" class="w-full">
        <template #header>
          <div class="flex-y-center h-3rem cursor-pointer">
            <div class="flex-1" ref="header">
              <ContentBox class="flex-shrink-0" normal>
                <el-text>debugger</el-text>
              </ContentBox>
            </div>
            <ContentBox @click="db.toggle">
              <i-ep-close class="c-[var(--el-color-danger)]"></i-ep-close>
            </ContentBox>
          </div>
        </template>
        <Debugger class="w-full"></Debugger>
      </el-card>
    </ScalePanel>
  </div>
</template>
<style lang="scss" scoped>
.handler {
  -webkit-app-region: no-drag;
}
</style>
