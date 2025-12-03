<script lang="ts" setup>
import { ProviderMeta } from "@renderer/types"
import { DialogPanel } from "@toolmain/components"
import { CallBackFn } from "@toolmain/shared"
import { Method } from "axios"
const { t } = useI18n()
const emit = defineEmits<{
  close: []
  confirm: [done: CallBackFn]
}>()
const props = defineProps<{
  provider: ProviderMeta
}>()
const provider = computed(() => props.provider)
const dataSets = ref<
  Array<{
    label: string
    field: string
    value: {
      method: Method
      url: string
    }
  }>
>([])
function init() {
  dataSets.value = [
    {
      label: t("modelType.Models"),
      field: "models",
      value: {
        method: provider.value.api.models?.method ?? "GET",
        url: provider.value.api.models?.url ?? "",
      },
    },
    {
      label: t("modelType.Chat"),
      field: "llmChat",
      value: {
        method: provider.value.api.llmChat?.method ?? "POST",
        url: provider.value.api.llmChat?.url ?? "",
      },
    },
    {
      label: t("modelType.TextToImage"),
      field: "textToImage",
      value: {
        method: provider.value.api.textToImage?.method ?? "POST",
        url: provider.value.api.textToImage?.url ?? "",
      },
    },
    {
      label: t("modelType.ImageToText"),
      field: "imageToText",
      value: {
        method: provider.value.api.imageToText?.method ?? "POST",
        url: provider.value.api.imageToText?.url ?? "",
      },
    },
    {
      label: t("modelType.TextToVideo"),
      field: "speechToText",
      value: {
        method: provider.value.api.speechToText?.method ?? "POST",
        url: provider.value.api.speechToText?.url ?? "",
      },
    },
    {
      label: t("modelType.TextToSpeech"),
      field: "textToSpeech",
      value: {
        method: provider.value.api.textToSpeech?.method ?? "POST",
        url: provider.value.api.textToSpeech?.url ?? "",
      },
    },
    {
      label: t("modelType.Embedding"),
      field: "embedding",
      value: {
        method: provider.value.api.embedding?.method ?? "POST",
        url: provider.value.api.embedding?.url ?? "",
      },
    },
    {
      label: t("modelType.Rerank"),
      field: "rerank",
      value: {
        method: provider.value.api.rerank?.method ?? "POST",
        url: provider.value.api.rerank?.url ?? "",
      },
    },
  ]
}
async function onConfirm(done: CallBackFn) {
  dataSets.value.forEach(item => {
    if (!Object.hasOwn(provider.value.api, item.field)) {
      provider.value.api[item.field] = item.value
    } else {
      Object.assign(provider.value.api[item.field], item.value)
    }
  })
  emit("confirm", () => {
    done()
    emit("close")
  })
}
async function onCancel() {
  emit("close")
}
onMounted(init)
</script>
<template>
  <DialogPanel class="h-50vh w-full">
    <el-form label-width="10rem" :model="provider">
      <el-form-item v-for="item in dataSets" :key="item.label" :label="item.label">
        <el-input v-model.trim="item.value.url" clearable>
          <template #prepend>
            <el-select v-model="item.value.method" class="w-10rem!">
              <el-option label="post" value="post" />
              <el-option label="get" value="get" />
              <el-option label="delete" value="delete" />
              <el-option label="put" value="put" />
              <el-option label="patch" value="patch" />
            </el-select>
          </template>
        </el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <Button type="primary" @click="onConfirm">{{ t("btn.confirm") }}</Button>
      <Button @click="onCancel">{{ t("btn.cancel") }}</Button>
    </template>
  </DialogPanel>
</template>
<style lang="scss" scoped></style>
