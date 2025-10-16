<script lang="ts" setup>
import { RAGLocalFileMeta } from "@shared/types/rag"
import { DialogPanel } from "@toolmain/components"
import { CallBackFn, errorToText, msgError } from "@toolmain/shared"
defineProps<{
  fileList: RAGLocalFileMeta[]
}>()
const upload = {
  async chooseFile(done: CallBackFn) {
    try {
      if (window.api.file) {
        const res = await window.api.file.chooseFilePath()
        console.log(res)
      }
    } catch (error) {
      msgError(errorToText(error))
    } finally {
      done()
    }
  },
}
const { t } = useI18n()
</script>
<template>
  <DialogPanel>
    <template #header>
      <el-button size="small" type="danger">{{ t("btn.delete") }} </el-button>
      <Button size="small" type="primary" @click="upload.chooseFile">
        <template #icon>
          <el-icon class="text-1.4rem"> <i class="i-ep:upload-filled"></i> </el-icon>
        </template>
        {{ t("btn.upload") }}
      </Button>
    </template>
    <div class="flex w-full h-full overflow-hidden flex-col gap-1rem">
      <el-card class="flex-shrink-0" shadow="never"> </el-card>
      <el-table size="small" border stripe table-layout="fixed" height="100%" :data="fileList">
        <el-table-column type="expand"></el-table-column>
        <el-table-column label="文件名" prop="fileName"></el-table-column>
        <el-table-column label="大小" prop="fileSize"></el-table-column>
        <el-table-column label="类型" prop="mimeType"></el-table-column>
        <el-table-column label="操作"></el-table-column>
      </el-table>
    </div>
  </DialogPanel>
</template>
<style lang="scss" scoped>
.upload {
  :deep(.el-upload) {
    --el-upload-dragger-padding-horizontal: 1rem;
  }
}
</style>
