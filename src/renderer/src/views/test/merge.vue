<script lang="ts" setup>
import { mergeWith } from "lodash-es"
const data = {
  choices: [],
  data: [{ index: 0 }],
}
const messages = []

// 使用 messages.value 访问数据
console.log(messages)
messages.forEach(msg => {
  mergeWith(data, msg, (objValue, srcValue, key) => {
    if (key === "content" || key === "arguments") {
      if (!objValue) {
        return srcValue ?? ""
      } else if (!srcValue) {
        return objValue
      } else {
        return objValue + srcValue
      }
    }
    if (srcValue === undefined || srcValue === null) {
      return objValue
    }
  })
})
console.log(data)
</script>
<template>
  <div></div>
</template>
<style lang="scss" scoped></style>
