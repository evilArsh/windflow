<script lang="ts" setup>
import { RAGEmbeddingConfig } from "@shared/types/rag"
import { Arrayable } from "@vueuse/core"
import { FormItemRule, FormInstance, CascaderValue, CascaderProps, CascaderNode, Resolve } from "element-plus"
import useProviderStore from "@renderer/store/provider"
import useModelStore from "@renderer/store/model"
import { storeToRefs } from "pinia"
import { ModelMeta, ProviderMeta } from "@renderer/types"
import { isArrayLength, resolvePath } from "@toolmain/shared"

const props = defineProps<{
  mode: "add" | "edit" | "view"
  form: RAGEmbeddingConfig
}>()
const emit = defineEmits<{
  enter: []
}>()
const isAdd = computed(() => props.mode === "add")
// const isEdit = computed(() => props.mode === "edit")
const isView = computed(() => props.mode === "view")
const providerStore = useProviderStore()
const modelStore = useModelStore()
const { providerMetas } = storeToRefs(providerStore)
const { models } = storeToRefs(modelStore)
const { t } = useI18n()
const formRef = useTemplateRef<FormInstance>("formRef")
const form = computed(() => props.form)

const ev = {
  onSelect(meta: ProviderMeta) {
    console.log(meta)
  },
  onEmbeddingChange(value: CascaderValue | null | undefined) {
    if (!isArrayLength(value)) {
      form.value.embedding.api = ""
      form.value.embedding.apiKey = ""
      form.value.embedding.model = ""
      form.value.embedding.providerName = ""
    } else {
      // value: [provider[,?model]]
      const provider: ProviderMeta = value[0]
      const model: ModelMeta | undefined = value.length > 1 ? value[1] : undefined
      form.value.embedding.api = provider.api.embedding?.url
        ? resolvePath([provider.api.url, provider.api.embedding.url])
        : ""
      form.value.embedding.apiKey = provider.api.key
      if (model) {
        form.value.embedding.model = model.modelName
        form.value.embedding.providerName = model.providerName
      }
    }
  },
  onRerankChange(value: CascaderValue | null | undefined) {
    if (isArrayLength(value) && value.length == 2) {
      if (!form.value.rerank) {
        form.value.rerank = {
          providerName: "",
          model: "",
          api: "",
          apiKey: "",
          method: "POST",
        }
      }
      const provider: ProviderMeta = value[0]
      const model: ModelMeta | undefined = value.length > 1 ? value[1] : undefined
      form.value.rerank.api = provider.api.rerank?.url ? resolvePath([provider.api.url, provider.api.rerank.url]) : ""
      form.value.rerank.apiKey = provider.api.key
      if (model) {
        form.value.rerank.model = model.modelName
        form.value.rerank.providerName = model.providerName
      }
    } else {
      form.value.rerank = undefined
    }
  },
  onLazyLoad(node: CascaderNode, resolve: Resolve, rerank?: boolean) {
    if (node.level == 0) {
      resolve(
        Object.values(providerMetas.value).map(val => {
          return {
            label: val.name,
            value: val,
            leaf: false,
            children: [],
          }
        })
      )
    } else if (node.level == 1) {
      if (!node.data.value) {
        resolve([])
        return
      }
      const data = node.data.value as ProviderMeta
      resolve(
        models.value
          .filter(
            v =>
              data.name === v.providerName &&
              (rerank ? modelStore.utils.isRerankerType(v) : modelStore.utils.isEmbeddingType(v))
          )
          .map(val => ({
            label: val.modelName,
            value: val,
            leaf: true,
          }))
      )
    } else {
      resolve([])
    }
  },
  onEmbeddingLazyLoad(node: CascaderNode, resolve: Resolve) {
    ev.onLazyLoad(node, resolve, false)
  },
  onRerankLazyLoad(node: CascaderNode, resolve: Resolve) {
    ev.onLazyLoad(node, resolve, true)
  },
  initData() {
    provider.embedding.length = 0
    provider.rerank.length = 0
    // --- embedding
    if (Object.hasOwn(providerMetas.value, form.value.embedding.providerName)) {
      provider.embedding.push(providerMetas.value[form.value.embedding.providerName])
    }
    let models = modelStore.findByProvider(form.value.embedding.providerName)
    let model = models.find(v => v.modelName === form.value.embedding.model)
    if (model) {
      provider.embedding.push(model)
    }
    // --- rerank
    if (!form.value.rerank) return
    if (Object.hasOwn(providerMetas.value, form.value.rerank.providerName)) {
      provider.rerank.push(providerMetas.value[form.value.rerank.providerName])
    }
    models = modelStore.findByProvider(form.value.rerank.providerName)
    model = models.find(v => v.modelName === form.value.rerank?.model)
    if (model) {
      provider.rerank.push(model)
    }
  },
}
const provider = reactive({
  props: {
    lazy: true,
    lazyLoad: ev.onEmbeddingLazyLoad,
  } as CascaderProps,
  propsRerank: {
    lazy: true,
    lazyLoad: ev.onRerankLazyLoad,
  } as CascaderProps,
  embedding: [] as (ProviderMeta | ModelMeta)[],
  rerank: [] as (ProviderMeta | ModelMeta)[],
  rules: {
    name: [{ type: "string", whitespace: false, required: true, message: t("form.stringFieldNotNull") }],
    embedding: [
      {
        required: true,
        validator: (_rule, val: RAGEmbeddingConfig["embedding"], callback) => {
          if (!val.providerName) {
            callback(new Error(t("knowledge.form.needProvider")))
          } else if (!val.model) {
            callback(new Error(t("knowledge.form.needEmbeddingModel")))
          } else if (!(val.api && val.apiKey)) {
            callback(new Error(t("knowledge.form.needApiKey")))
          } else {
            callback()
          }
        },
      },
    ],
    rerank: [
      {
        required: false,
        validator: (_rule, val: RAGEmbeddingConfig["rerank"], callback) => {
          if (!val) {
            callback()
            return
          }
          if (val.providerName && val.model && !(val.api && val.apiKey)) {
            callback(new Error(t("knowledge.form.needApiKey")))
          } else {
            callback()
          }
        },
      },
    ],
  } as Partial<Record<string, Arrayable<FormItemRule>>>,
})

onMounted(() => {
  ev.initData()
})
defineExpose({
  form: formRef,
})
</script>
<template>
  <el-form ref="formRef" :rules="provider.rules" :model="form" label-width="180px">
    <el-form-item prop="name" :label="t('embedding.name')">
      <el-input :readonly="isView" v-model.trim="form.name" @keyup.enter="emit('enter')" :maxlength="120"></el-input>
    </el-form-item>
    <el-form-item prop="embedding" :label="t('embedding.embeddingProvider')">
      <el-cascader
        :disabled="!isAdd"
        class="w-full"
        clearable
        v-model="provider.embedding"
        :props="provider.props"
        @change="ev.onEmbeddingChange" />
    </el-form-item>
    <el-form-item prop="rerank" :label="t('embedding.rerankProvider')">
      <el-cascader
        :disabled="isView"
        class="w-full"
        clearable
        v-model="provider.rerank"
        :props="provider.propsRerank"
        @change="ev.onRerankChange" />
    </el-form-item>
    <el-form-item prop="dimensions">
      <template #label>
        <ContentBox normal>
          <el-text>{{ t("knowledge.dimensions") }}</el-text>
          <template #end>
            <div class="flex items-center justify-center">
              <el-tooltip :content="t('knowledge.dimensionsDesc')" placement="top">
                <i-material-symbols:help-outline></i-material-symbols:help-outline>
              </el-tooltip>
            </div>
          </template>
        </ContentBox>
      </template>
      <el-input-number
        class="w-full!"
        :disabled="!isAdd"
        :precision="0"
        :min="512"
        :max="9999"
        v-model="form.dimensions"
        @keyup.enter="emit('enter')"></el-input-number>
    </el-form-item>
    <el-form-item prop="maxTokens">
      <template #label>
        <ContentBox normal>
          <el-text>{{ t("knowledge.maxTokens") }}</el-text>
          <template #end>
            <div class="flex items-center justify-center">
              <el-tooltip :content="t('knowledge.maxTokensDesc')" placement="top">
                <i-material-symbols:help-outline></i-material-symbols:help-outline>
              </el-tooltip>
            </div>
          </template>
        </ContentBox>
      </template>
      <el-input-number
        :disabled="!isAdd"
        class="w-full!"
        :precision="0"
        :min="128"
        :max="9999"
        v-model="form.maxTokens"
        @keyup.enter="emit('enter')"></el-input-number>
    </el-form-item>
    <el-form-item prop="maxInputs">
      <template #label>
        <ContentBox normal>
          <el-text>{{ t("knowledge.maxInputs") }}</el-text>
          <template #end>
            <div class="flex items-center justify-center">
              <el-tooltip :content="t('knowledge.maxInputsDesc')" placement="top">
                <i-material-symbols:help-outline></i-material-symbols:help-outline>
              </el-tooltip>
            </div>
          </template>
        </ContentBox>
      </template>
      <el-input-number
        :disabled="!isAdd"
        class="w-full!"
        :precision="0"
        :min="10"
        :max="9999"
        v-model="form.maxInputs"
        @keyup.enter="emit('enter')"></el-input-number>
    </el-form-item>
    <el-form-item prop="maxFileChunks">
      <template #label>
        <ContentBox normal>
          <el-text>{{ t("knowledge.maxFileChunks") }}</el-text>
          <template #end>
            <div class="flex items-center justify-center">
              <el-tooltip :content="t('knowledge.maxFileChunksDesc')" placement="top">
                <i-material-symbols:help-outline></i-material-symbols:help-outline>
              </el-tooltip>
            </div>
          </template>
        </ContentBox>
      </template>
      <el-input-number
        :disabled="!isAdd"
        class="w-full!"
        :precision="0"
        :min="128"
        :max="9999"
        v-model="form.maxFileChunks"
        @keyup.enter="emit('enter')"></el-input-number>
    </el-form-item>
  </el-form>
</template>
<style lang="scss" scoped></style>
