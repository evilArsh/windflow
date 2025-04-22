<script lang="ts" setup>
import { CallBackFn } from "@renderer/lib/shared/types"
import { MCPStdioServer } from "@renderer/types"
import { cloneDeep } from "lodash"
import useMcpStore from "@renderer/store/mcp.store"
import { errorToText } from "@shared/error"
import Form from "./form.vue"
const mcp = useMcpStore()
const props = defineProps<{
  mode: "edit" | "add"
  data?: MCPStdioServer
}>()
const emit = defineEmits<{
  (e: "change", value: MCPStdioServer): void
}>()
const { t } = useI18n()
const formRef = useTemplateRef("form")
const handler = {
  async onSave(done: CallBackFn) {
    if (!formRef.value) {
      done()
      return
    }
    const formData = formRef.value.getFormData()
    formRef.value.validate(async valid => {
      try {
        if (valid) {
          if (props.mode === "add") {
            await mcp.api.add(cloneDeep(formData))
          } else {
            await mcp.api.update(cloneDeep(formData))
          }
          emit("change", formData)
        }
      } catch (error) {
        msg({ code: 500, msg: errorToText(error) })
      } finally {
        done()
      }
    })
  },
}
</script>
<template>
  <div class="px-1rem flex-1">
    <Form ref="form" :data></Form>
    <div class="flex gap1rem">
      <Button type="primary" @click="handler.onSave">{{ t("btn.save") }}</Button>
      <slot></slot>
    </div>
  </div>
</template>
