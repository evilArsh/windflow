<script lang="ts" setup>
import { CSSProperties, merge, px, toNumber } from "@toolmain/shared"
import { AbbrsNode } from "."

const props = withDefaults(
  defineProps<{
    /**
     * the gap step
     */
    spacing?: number
    data: AbbrsNode[]
    width?: CSSProperties["width"]
    height?: CSSProperties["height"]
    nodeClass?: string
    nodeStyle?: CSSProperties
    maxLength?: number
  }>(),
  {
    spacing: 10,
    width: 30,
    height: 30,
    nodeClass: "",
    maxLength: 5,
    nodeStyle: () => ({}),
  }
)
const nodeStyle = computed<(index: number) => CSSProperties>(() => {
  return (index: number) =>
    merge(
      {
        width: px(props.width),
        height: px(props.height),
        marginLeft: index == 0 ? 0 : px(-toNumber(props.spacing)),
      },
      props.nodeStyle
    )
})
const exceed = computed(() => Math.max(0, props.data.length - props.maxLength))
</script>
<template>
  <div class="abbrs-container">
    <TransitionGroup name="list" tag="ul">
      <template v-for="(item, index) in data.slice(0, maxLength)" :key="index">
        <div v-if="item.type === 'text'" :style="nodeStyle(index)" class="abbrs" :class="[nodeClass]">
          <span>{{ item.data }}</span>
        </div>
        <img
          v-else-if="item.type === 'image'"
          :style="nodeStyle(index)"
          class="abbrs"
          :class="[nodeClass]"
          :src="item.data" />
        <Svg
          v-else-if="item.type === 'svg'"
          :style="nodeStyle(index)"
          class="abbrs"
          :class="[nodeClass]"
          :src="item.data"></Svg>
      </template>
      <div
        v-if="exceed"
        :style="nodeStyle(data.length)"
        style="--abbr-font-size: 12px"
        class="abbrs"
        :class="[nodeClass]">
        <span>+{{ props.data.length }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style lang="scss" scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
.list-leave-active {
  position: absolute;
}

.abbrs-container {
  transition: width 0.5s ease;
  --abbrs-border-type: solid;
  --abbrs-border-color: var(--el-border-color);
  --abbrs-border-width: 1px;
  --abbrs-border-radius: 50%;
  --abbrs-padding: var(--ai-gap-base);
  --abbrs-bg-color: var(--el-fill-color);
  --abbrs-text-color: var(--el-text-color-primary);
  --abbr-font-size: 14px;
  position: relative;
  display: inline-block;
  overflow: hidden;
}
.abbrs {
  border: var(--abbrs-border-type) var(--abbrs-border-width) var(--abbrs-border-color);
  border-radius: var(--abbrs-border-radius);
  padding: var(--abbrs-padding);
  background-color: var(--abbrs-bg-color);
  color: var(--abbrs-text-color);
  font-size: var(--abbr-font-size);
  display: flex;
  align-items: center;
  justify-content: center;
  float: left;
}
</style>
