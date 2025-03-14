<template>
  <template v-if="scale">
    <i
      v-for="i in scale.pointer"
      v-show="config.scalable"
      :key="i"
      :class="[`p-${i}`]"
      @mousedown="scale.onMouseDown($event, i)"></i>
  </template>
</template>
<script lang="ts" setup>
import { getValue, toNumber } from "@renderer/lib/shared/styles"
import { ScaleConfig } from "../../types"
import useHandle from "../../useHandle"
import useScale from "../../useScale"
import { MoveType } from "@renderer/lib/drag"
const props = defineProps<{
  config: ScaleConfig
  scale?: ReturnType<typeof useScale>
  handle?: ReturnType<typeof useHandle>
  move?: MoveType
}>()
const zIndex = computed(() => {
  return props.config.normal ? undefined : getValue("zIndex", toNumber(props.config.containerStyle?.zIndex))
})
</script>

<style lang="scss" scoped>
$--a-scale-panel-border-radius: 4px;
$--a-scale-pointer-width: 4px;
$--a-scale-pointer-height: 4px;
$--a-scale-pointer-bg: transparent;
.p {
  &-t,
  &-r,
  &-b,
  &-l,
  &-lt,
  &-rt,
  &-lb,
  &-rb {
    z-index: v-bind(zIndex);
    position: absolute;
  }
  &-b,
  &-t,
  &-r,
  &-l {
    background-color: $--a-scale-pointer-bg;
    border-radius: 4px;
  }
  &-b,
  &-t {
    height: $--a-scale-pointer-height;
    left: $--a-scale-pointer-height;
    right: $--a-scale-pointer-height;
  }
  &-r,
  &-l {
    width: $--a-scale-pointer-width;
    top: $--a-scale-pointer-height;
    bottom: $--a-scale-pointer-height;
  }
  &-lt,
  &-rt,
  &-lb,
  &-rb {
    width: 0;
    height: 0;
  }
  &-b {
    bottom: 0;
    cursor: ns-resize;
  }
  &-t {
    top: 0;
    cursor: ns-resize;
  }
  &-r {
    right: 0;
    cursor: ew-resize;
  }
  &-l {
    left: 0;
    cursor: ew-resize;
  }
  &-lt {
    left: 0;
    top: 0;
    cursor: nwse-resize;
    border-top: 0.4rem solid $--a-scale-pointer-bg;
    border-left: 0.4rem solid $--a-scale-pointer-bg;
    border-right: 0.4rem solid transparent;
    border-bottom: 0.4rem solid transparent;
  }
  &-rt {
    right: 0;
    top: 0;
    cursor: nesw-resize;
    border-top: 0.4rem solid $--a-scale-pointer-bg;
    border-left: 0.4rem solid transparent;
    border-right: 0.4rem solid $--a-scale-pointer-bg;
    border-bottom: 0.4rem solid transparent;
  }
  &-lb {
    left: 0;
    bottom: 0;
    cursor: nesw-resize;
    border-top: 0.4rem solid transparent;
    border-left: 0.4rem solid $--a-scale-pointer-bg;
    border-right: 0.4rem solid transparent;
    border-bottom: 0.4rem solid $--a-scale-pointer-bg;
  }
  &-rb {
    right: 0;
    bottom: 0;
    cursor: nwse-resize;
    border-top: 0.4rem solid transparent;
    border-left: 0.4rem solid transparent;
    border-right: 0.4rem solid $--a-scale-pointer-bg;
    border-bottom: 0.4rem solid $--a-scale-pointer-bg;
  }
}
</style>
