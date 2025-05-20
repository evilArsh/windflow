<script lang="ts" setup>
const props = defineProps<{
  target: string
  offset?: number
}>()
const affixRef = useTemplateRef("affix")
const childEl = shallowRef<HTMLElement | null>()
const targetEl = shallowRef<HTMLElement | null>()
const elObserver = shallowRef<IntersectionObserver>()

function elVisibleListener(el: HTMLElement) {
  elObserver.value = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        // TODO
      } else {
        // TODO
      }
    })
  })
  elObserver.value.observe(el)
}
function init() {
  childEl.value = affixRef.value?.firstElementChild as HTMLElement | null
  targetEl.value = document.querySelector(props.target) as HTMLElement | null
  if (targetEl.value) {
    elVisibleListener(targetEl.value)
  }
}
onMounted(() => {
  init()
})
onBeforeUnmount(() => {
  elObserver.value?.disconnect()
})
</script>
<template>
  <div class="affix" ref="affix">
    <slot></slot>
  </div>
</template>
<style lang="scss" scoped>
.affix {
}
</style>
