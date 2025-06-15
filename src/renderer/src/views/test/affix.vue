<script lang="ts" setup>
import Affix from "@renderer/components/Affix/index.vue"
const data = ref([{ id: useId() }, { id: useId() }])
</script>
<template>
  <div class="border-dashed border-1px border-#333 mx-auto my-0 h50vh w-50vw overflow-auto">
    <ContentLayout>
      <el-card>
        <template #header>
          <el-button type="primary">这是一个卡片</el-button>
        </template>
        <div class="flex gap-1rem overflow-auto">
          <MsgBubble :key="item.id" v-for="item in data" class="w-full flex-shrink-0!" :id="item.id">
            <template #header>
              <Affix :target="`#${item.id}`">
                <div class="flex flex-wrap border-b-1px border-solid border-#333 bg-#00cee580">
                  <el-text type="primary">标题</el-text>
                  <el-text type="danger" size="small">副标题</el-text>
                  <el-button type="primary">按钮</el-button>
                </div>
              </Affix>
            </template>
            <el-card>
              <template #header>
                <el-text>这是一个卡片</el-text>
              </template>
              <el-text class="block!" v-for="i in 20" :key="i">
                我是你的智能助手，可以帮助你解答问题、提供建议、处理各种任务！无论是学习、工作，还是日常生活中的疑问，都可以问我哦～
                😊
              </el-text>
              <template #footer>
                <el-text>这是卡片的底部内容</el-text>
              </template>
            </el-card>
          </MsgBubble>
        </div>
      </el-card>
    </ContentLayout>
    <el-card>
      <el-text class="block!" v-for="i in 20" :key="i">
        我是你的智能助手，可以帮助你解答问题、提供建议、处理各种任务！无论是学习、工作，还是日常生活中的疑问，都可以问我哦～
        😊
      </el-text>
    </el-card>
    <el-card>
      <el-text class="block!" v-for="i in 20" :key="i">
        我是你的智能助手，可以帮助你解答问题、提供建议、处理各种任务！无论是学习、工作，还是日常生活中的疑问，都可以问我哦～
        😊
      </el-text>
    </el-card>
  </div>
</template>
<style lang="scss" scoped></style>
