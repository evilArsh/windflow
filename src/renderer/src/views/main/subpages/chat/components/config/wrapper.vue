<script lang="ts" setup>
import ToolBar from "@renderer/components/ScalePanel/plugins/toolbar/index.vue"
import ScalePanel from "@renderer/components/ScalePanel/index.vue"
import { ScaleInstance, type BaseMountedParams } from "@renderer/components/ScalePanel/types"
import useScale from "./useScale"
import useStick from "./useStick"

const moveRef = useTemplateRef("move")
const panelRef = useTemplateRef<ScaleInstance>("panel")
const baseParams = ref<BaseMountedParams>()
const toolWidth = ref(40)

const { config } = useScale()
const { scaleEv, lock, hover, folded, toggle, toggleLock, toggleHover, onMouseEnter, onMouseLeave } = useStick(
  panelRef,
  toolWidth,
  baseParams
)
</script>
<template>
  <ScalePanel
    ref="panel"
    v-model="config"
    :target="moveRef"
    @after-move="scaleEv.onAfterMove"
    @after-scale="scaleEv.onAfterScale"
    @scaling="scaleEv.onScaling"
    @moving="scaleEv.onMoving"
    @mounted="scaleEv.onScaleMounted"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave">
    <template #default="def">
      <div class="wrapper">
        <div class="tool" :style="{ width: `${toolWidth}px` }">
          <ToolBar
            :config="config"
            :scale="def.scale"
            :handle="baseParams?.handle"
            :move="unref(def.move)"
            :drag-offset="unref(def.dragOffset)">
            <Hover :default-lock="lock" need-lock @lock="toggleLock">
              <el-button size="small" circle>
                <i-ic:baseline-lock></i-ic:baseline-lock>
              </el-button>
            </Hover>
            <Hover :default-lock="hover" need-lock @lock="toggleHover">
              <el-button size="small" circle>
                <i-ic:round-touch-app></i-ic:round-touch-app>
              </el-button>
            </Hover>
            <Hover>
              <el-switch
                :model-value="folded"
                @change="toggle"
                :active-value="false"
                :inactive-value="true"
                size="small"></el-switch>
            </Hover>
          </ToolBar>
          <div class="move" ref="move"></div>
        </div>
        <slot></slot>
      </div>
    </template>
  </ScalePanel>
</template>
<style lang="scss" scoped>
@use "./style.scss";
</style>
