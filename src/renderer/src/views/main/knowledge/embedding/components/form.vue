<script lang="ts" setup>
import { RAGEmbeddingConfig } from "@shared/types/rag"
import { Arrayable } from "@vueuse/core"
import { FormItemRule, FormInstance } from "element-plus"

const props = defineProps<{
  form: RAGEmbeddingConfig
  rules?: Partial<Record<string, Arrayable<FormItemRule>>>
}>()
const formRef = useTemplateRef<FormInstance>("form")
const form = computed(() => props.form)
const { t } = useI18n()

defineExpose({
  form: formRef,
})
</script>
<template>
  <el-form ref="form" :rules :model="form" label-width="180px">
    <el-form-item prop="type" :label="t('embedding.name')">
      <el-input v-model="form.name"></el-input>
    </el-form-item>
    <el-form-item prop="embedding" :label="t('embedding.provider')"> </el-form-item>
    <el-form-item prop="dimensions">
      <template #label>
        <ContentBox normal>
          <el-text>{{ t("knowledge.dimensions") }}</el-text>
          <template #end>
            <el-tooltip :content="t('knowledge.dimensionsDesc')" placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
        </ContentBox>
      </template>
      <el-input-number :precision="0" :min="512" :max="9999" v-model="form.dimensions"></el-input-number>
    </el-form-item>
    <el-form-item prop="maxTokens">
      <template #label>
        <ContentBox normal>
          <el-text>{{ t("knowledge.maxTokens") }}</el-text>
          <template #end>
            <el-tooltip :content="t('knowledge.maxTokensDesc')" placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
        </ContentBox>
      </template>
      <el-input-number :precision="0" :min="128" :max="9999" v-model="form.maxTokens"></el-input-number>
    </el-form-item>
    <el-form-item prop="maxInputs">
      <template #label>
        <ContentBox normal>
          <el-text>{{ t("knowledge.maxInputs") }}</el-text>
          <template #end>
            <el-tooltip :content="t('knowledge.maxInputsDesc')" placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
        </ContentBox>
      </template>
      <el-input-number :precision="0" :min="10" :max="9999" v-model="form.maxInputs"></el-input-number>
    </el-form-item>
    <el-form-item prop="maxFileChunks">
      <template #label>
        <ContentBox normal>
          <el-text>{{ t("knowledge.maxFileChunks") }}</el-text>
          <template #end>
            <el-tooltip :content="t('knowledge.maxFileChunksDesc')" placement="top">
              <i-material-symbols:help-outline></i-material-symbols:help-outline>
            </el-tooltip>
          </template>
        </ContentBox>
      </template>
      <el-input-number :precision="0" :min="128" :max="9999" v-model="form.maxFileChunks"></el-input-number>
    </el-form-item>
  </el-form>
</template>
<style lang="scss" scoped></style>
