<template>
  <div class="wraper">
    <div>
      <el-button @click="hdl.show">显示auto</el-button>
      <el-button @click="hdl.showSelf">显示self</el-button>
      <el-button @click="hdl.showCenter">显示center</el-button>
      <el-button @click="hdl.showLeft">显示left</el-button>
      <el-button @click="hdl.showRight">显示right</el-button>
      <el-button @click="hdl.showTop">显示top</el-button>
      <el-button @click="hdl.showBottom">显示bottom</el-button>
    </div>
    <div>
      <el-button @click="hdl.hide">隐藏auto</el-button>
      <el-button @click="hdl.hideSelf">隐藏self</el-button>
      <el-button @click="hdl.hideCenter">隐藏center</el-button>
      <el-button @click="hdl.hideSelfLeft">隐藏left</el-button>
      <el-button @click="hdl.hideSelfRight">隐藏right</el-button>
      <el-button @click="hdl.hideSelfTop">隐藏top</el-button>
      <el-button @click="hdl.hideSelfBottom">隐藏bottom</el-button>
    </div>
    <div class="p-5px">
      <el-segmented
        v-model="conf.visible"
        :options="[
          { label: '显示', value: true },
          { label: '隐藏', value: false },
        ]" />
      <div>
        <el-input-number v-model="conf.x"></el-input-number>
        <el-input-number v-model="conf.y"></el-input-number>
      </div>
    </div>
    <ScalePanel ref="scaleRef" v-model="conf" :drag-target="outerRef">
      <!-- <ScalePanel :model-value="confInner">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>Card name</span>
              <el-button class="button" text>Operation button</el-button>
            </div>
          </template>
          <div ref="outerRef" class="w50px h50px bg-red"></div>
          <div v-for="o in 4" :key="o" class="text item">{{ "List item " + o }}</div>
        </el-card>
      </ScalePanel> -->
      <el-card>
        <template #header>
          <div class="card-header">
            <span>Card name</span>
            <el-button class="button" text>Operation button</el-button>
          </div>
        </template>
        <div ref="outerRef" class="w50px h50px bg-red"></div>
        <div v-for="o in 4" :key="o" class="text item">{{ "List item " + o }}</div>
      </el-card>
    </ScalePanel>
  </div>
</template>
<script lang="ts" setup>
import { ScaleConfig } from "@renderer/components/ScalePanel/types"

const scaleRef = useTemplateRef("scaleRef")
const outerRef = useTemplateRef("outerRef")
const hdl = {
  show: () => {
    void scaleRef.value?.show(true)
  },
  showSelf: () => {
    void scaleRef.value?.show(true, "self")
  },
  showCenter: () => {
    void scaleRef.value?.show(true, "center")
  },
  showLeft: () => {
    void scaleRef.value?.show(true, "left")
  },
  showRight: () => {
    void scaleRef.value?.show(true, "right")
  },
  showTop: () => {
    void scaleRef.value?.show(true, "top")
  },
  showBottom: () => {
    void scaleRef.value?.show(true, "bottom")
  },
  hide: () => {
    void scaleRef.value?.autoHide(true)
  },
  hideSelf: () => {
    void scaleRef.value?.hideTo("self", true)
  },
  hideCenter: () => {
    void scaleRef.value?.hideTo("center", true)
  },
  hideSelfLeft: () => {
    void scaleRef.value?.hideTo("left", true)
  },
  hideSelfRight: () => {
    void scaleRef.value?.hideTo("right", true)
  },
  hideSelfTop: () => {
    void scaleRef.value?.hideTo("top", true)
  },
  hideSelfBottom: () => {
    void scaleRef.value?.hideTo("bottom", true)
  },
}
const conf = ref<ScaleConfig>({
  visible: false,
  movable: true,
  scalable: true,
  containerStyle: {
    position: "absolute",
    backgroundColor: "rgb(227,227,227)",
    width: 501,
    height: 502,
  },
  contentStyle: {
    width: "100%",
    height: "100%",
    overflow: "auto",
  },
})
// const confInner = ref<ScaleConfig>({
//   normal: true,
//   containerStyle: {
//     position: "absolute",
//     backgroundColor: "#fff",
//     width: 301,
//     height: 202,
//   },
//   contentStyle: {
//     width: "100%",
//     height: "100%",
//     overflow: "auto",
//   },
// })
</script>
<style lang="scss" scoped>
.wraper {
  position: relative;
  border: dashed 2px red;
  left: 300px;
  top: 20px;
  width: 700px;
  height: 700px;
}
</style>
