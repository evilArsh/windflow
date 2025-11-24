<script lang="ts" setup>
import { ScaleConfig } from "@toolmain/components"
import { useShortcut, z } from "@toolmain/shared"
import { DialogPanel, ScalePanel } from "@toolmain/components"

const shortcut = useShortcut()

const scaleRef = useTemplateRef("scale")
const headerRef = useTemplateRef<HTMLDivElement>("header")
const defaults = {
  width: () => window.innerWidth * 0.85,
  height: () => window.innerHeight * 0.85,
}
const panelConfig = reactive<ScaleConfig>({
  containerStyle: {
    zIndex: z.FIXED,
    position: "fixed",
    width: defaults.width(),
    height: defaults.height(),
    left: 0,
    top: 0,
    overflow: "auto",
    boxShadow: "var(--el-box-shadow-dark)",
    backgroundColor: "var(--el-bg-color)",
    minWidth: "20rem",
    minHeight: "20rem",
  },
  visible: false,
  movable: true,
  scalable: true,
})
const db = {
  toggle() {
    if (scaleRef.value?.getStatus() === "NORMAL") {
      scaleRef.value?.hideTo("self", false)
    } else {
      panelConfig.containerStyle!.width = defaults.width()
      panelConfig.containerStyle!.height = defaults.height()
      scaleRef.value?.show(false, "center")
    }
  },
}

shortcut.listen("ctrl+d", res => {
  res && db.toggle()
})
</script>
<template>
  <div class="handler flex-y-center">
    <!-- <ContentBox @click="db.toggle">
      <i-ic-round-terminal class="text-1.8rem"></i-ic-round-terminal>
    </ContentBox> -->
    <ScalePanel v-model="panelConfig" ref="scale" :drag-target="headerRef">
      <DialogPanel>
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
        <Debugger></Debugger>
      </DialogPanel>
    </ScalePanel>
  </div>
</template>
<style lang="scss" scoped>
.handler {
  -webkit-app-region: no-drag;
}
</style>
