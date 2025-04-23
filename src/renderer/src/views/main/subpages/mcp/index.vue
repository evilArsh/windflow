<script lang="ts" setup>
const currentTab = ref("")
const menus = ref()
</script>
<template>
  <SubNavLayout id="mcp.subNav">
    <template #submenu>
      <el-scrollbar>
        <el-card style="--el-card-padding: 1rem" shadow="never">
          <div class="w-full flex flex-col">
            <el-menu :default-active="currentTab">
              <el-menu-item index="1-1">item one</el-menu-item>
              <el-menu-item index="1-2">item two</el-menu-item>
            </el-menu>
          </div>
        </el-card>
      </el-scrollbar>
    </template>
    <template #content> </template>
  </SubNavLayout>
</template>
<style lang="scss" scoped>
.mcp-tree {
  --el-tree-node-content-height: 4rem;
}
.mcp-tree-node {
  --mcp-tree-icon-size: 3rem;
  display: flex;
  gap: 0.5rem;
  flex: 1;
  overflow: hidden;
  padding: 0.5rem;
  .mcp-tree-icon {
    transition: all 0.3s ease-in-out;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--mcp-tree-icon-size);
    height: var(--mcp-tree-icon-size);
    border-radius: 0.5rem;
    &:hover {
      background-color: rgba(10, 205, 231, 0.2);
    }
  }
  .mcp-tree-label {
    font-size: 14px;
    flex: 1;
    overflow: hidden;
  }
}
</style>
