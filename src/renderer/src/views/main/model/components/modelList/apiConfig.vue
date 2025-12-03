<script lang="ts" setup>
import { ProviderMeta } from "@renderer/types"
import { DialogPanel } from "@toolmain/components"
import { CallBackFn, cloneDeep } from "@toolmain/shared"
import { Method } from "axios"
const { t } = useI18n()
const emit = defineEmits<{
  close: []
  confirm: [provider: ProviderMeta, done: CallBackFn]
}>()
const props = defineProps<{
  provider: ProviderMeta
}>()
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
        method: props.provider.api.models?.method ?? "GET",
        url: props.provider.api.models?.url ?? "",
      },
    },
    {
      label: t("modelType.Chat"),
      field: "llmChat",
      value: {
        method: props.provider.api.llmChat?.method ?? "POST",
        url: props.provider.api.llmChat?.url ?? "",
      },
    },
    {
      label: t("modelType.TextToImage"),
      field: "textToImage",
      value: {
        method: props.provider.api.textToImage?.method ?? "POST",
        url: props.provider.api.textToImage?.url ?? "",
      },
    },
    {
      label: t("modelType.ImageToText"),
      field: "imageToText",
      value: {
        method: props.provider.api.imageToText?.method ?? "POST",
        url: props.provider.api.imageToText?.url ?? "",
      },
    },
    {
      label: t("modelType.TextToVideo"),
      field: "speechToText",
      value: {
        method: props.provider.api.speechToText?.method ?? "POST",
        url: props.provider.api.speechToText?.url ?? "",
      },
    },
    {
      label: t("modelType.TextToSpeech"),
      field: "textToSpeech",
      value: {
        method: props.provider.api.textToSpeech?.method ?? "POST",
        url: props.provider.api.textToSpeech?.url ?? "",
      },
    },
    {
      label: t("modelType.Embedding"),
      field: "embedding",
      value: {
        method: props.provider.api.embedding?.method ?? "POST",
        url: props.provider.api.embedding?.url ?? "",
      },
    },
    {
      label: t("modelType.Rerank"),
      field: "rerank",
      value: {
        method: props.provider.api.rerank?.method ?? "POST",
        url: props.provider.api.rerank?.url ?? "",
      },
    },
  ]
}
async function onConfirm(done: CallBackFn) {
  const provider = cloneDeep(props.provider)
  dataSets.value.forEach(item => {
    if (!Object.hasOwn(provider.api, item.field)) {
      provider.api[item.field] = item.value
    } else {
      provider.api[item.field] = item.value
    }
  })
  emit("confirm", provider, () => {
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
