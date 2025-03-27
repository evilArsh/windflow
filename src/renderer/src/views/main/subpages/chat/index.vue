<script lang="ts" setup>
import SubNavLayout from "@renderer/components/SubNavLayout/index.vue"
import { ChatTopic } from "@renderer/types"
import ChatContent from "./components/chat-content.vue"
import useChatStore from "@renderer/store/chat.store"
import { storeToRefs } from "pinia"
import EditTopic from "./components/toolbox/editTopic/index.vue"
import { ScaleConfig, type ScaleInstance } from "@renderer/components/ScalePanel/types"
import MenuHandle from "./components/toolbox/menuHandle/index.vue"
const { t } = useI18n()
const keyword = ref<string>("") // 搜索关键字
const currentTopic = ref<ChatTopic>() // 当前选中的聊天
const charStore = useChatStore()
const { topicList } = storeToRefs(charStore)

const scaleRef = useTemplateRef<ScaleInstance>("scale")
const scrollRef = useTemplateRef("scroll")
const menuRef = useTemplateRef<{ bounding: () => DOMRect | undefined }>("menuRef")
const editTopicRef = useTemplateRef<{ bounding: () => DOMRect | undefined }>("editTopicRef")
const dlg = reactive({
  data: {
    hideFirst: true,
    containerStyle: {
      zIndex: z.FIXED,
      position: "fixed",
      width: 100,
      left: 0,
      top: 0,
      maxHeight: "100vh",
      overflow: "auto",
    },
    mask: false,
    maskStyle: {
      backgroundColor: "rgba(0, 0, 0, 0)",
      zIndex: z.FIXED - 1,
    },
  } as ScaleConfig,
  is: "" as "menu" | "editTopic",

  selectedTopic: null as ChatTopic | null,
  moveDlg: markRaw(
    async (x: number, y: number, target: Readonly<Ref<{ bounding: () => DOMRect | undefined } | null>>) => {
      await scaleRef.value?.show(false, "self")
      const rect = target.value?.bounding()
      let fy = y + toNumber(rect?.height) > window.innerHeight ? window.innerHeight - toNumber(rect?.height) : y
      fy = fy < 0 ? 0 : fy
      scaleRef.value?.moveTo(false, { x, y: fy })
    }
  ),
  // 菜单编辑按钮
  onMenuEdit: markRaw((event: MouseEvent) => {
    if (dlg.selectedTopic) {
      dlg.is = "editTopic"
      dlg.data.containerStyle!.width = "600px"
      dlg.moveDlg(event.clientX, event.clientY, editTopicRef)
    }
  }),
  // 菜单删除按钮
  onMenuDelete: markRaw(() => {}),
  // 新增子聊天
  onMenuAdd: markRaw(() => {}),
  // 打开菜单
  openMenu: markRaw((event: MouseEvent, data: ChatTopic) => {
    dlg.is = "menu"
    dlg.data.containerStyle!.width = "100px"
    dlg.selectedTopic = data
    dlg.data.mask = true
    dlg.moveDlg(event.clientX, event.clientY, menuRef) // 弹出菜单框
  }),
  // 点击icon快速编辑
  openQuickEdit: markRaw((event: MouseEvent, data: ChatTopic) => {
    dlg.selectedTopic = data
    dlg.data.mask = true
    dlg.onMenuEdit(event) // 弹出编辑框
  }),
  // 新增聊天
  openEditTopic: markRaw(() => {
    currentTopic.value = {
      id: uniqueId(),
      label: "新的聊天",
      icon: "",
      content: "",
      modelIds: [],
      children: [],
      prompt: "you are a helpful assistant",
    }
    topicList.value.push(currentTopic.value)
    charStore.dbAddChatTopic(currentTopic.value)
    setTimeout(() => {
      scrollRef.value?.scrollTo(0, scrollRef.value.wrapRef?.clientHeight)
    }, 0)
  }),
  // 点击菜单遮罩层
  clickMask: markRaw(() => {
    dlg.data.mask = false
    scaleRef.value?.hideTo("self", false)
    tree.currentHover = ""
  }),
})

const tree = reactive({
  // 树属性
  props: {
    label: "label",
    children: "children",
    isLeaf: "isLeaf",
  },
  // 节点点击
  onNodeClick: markRaw((data: ChatTopic) => {
    currentTopic.value = data
  }),
  // 鼠标移动过的节点
  currentHover: "",
  onMouseEnter: markRaw((data: ChatTopic) => {
    tree.currentHover = data.id
  }),
  onMouseLeave: markRaw(() => {
    if (!dlg.data.mask) {
      tree.currentHover = ""
    }
  }),
})

watch(
  currentTopic,
  data => {
    data && charStore.dbUpdateChatTopic(data)
  },
  { deep: true }
)
watch(
  () => dlg.selectedTopic,
  data => {
    data && charStore.dbUpdateChatTopic(data)
  },
  { deep: true }
)
onMounted(() => {
  window.addEventListener("resize", dlg.clickMask)
})
onBeforeUnmount(() => {
  window.removeEventListener("resize", dlg.clickMask)
})
</script>
<template>
  <SubNavLayout>
    <template #submenu>
      <div class="chat-provider-header">
        <el-input v-model="keyword" :placeholder="t('chat.search')" />
        <el-button @click="dlg.openEditTopic">
          <template #icon>
            <i class="text-1.4rem i-ep:plus"></i>
          </template>
          <el-text>{{ t("chat.addChat") }}</el-text>
        </el-button>
      </div>
      <div class="chat-provider-content">
        <el-scrollbar ref="scroll">
          <el-tree
            highlight-current
            :current-node-key="currentTopic?.id"
            @node-click="tree.onNodeClick"
            :data="topicList"
            node-key="id"
            :props="tree.props">
            <template #default="{ data }: { data: ChatTopic }">
              <div class="chat-tree-node" @mouseenter="tree.onMouseEnter(data)" @mouseleave="tree.onMouseLeave">
                <div class="chat-tree-icon" @click.stop="dlg.openQuickEdit($event, data)">
                  <Svg :src="data.icon" class="text-18px"></Svg>
                </div>
                <el-text line-clamp="2" class="chat-tree-label">{{ data.label }}</el-text>
                <div v-show="tree.currentHover === data.id" class="chat-tree-handle">
                  <el-button @click.stop="dlg.openMenu($event, data)" circle size="small">
                    <i-ep:more-filled></i-ep:more-filled>
                  </el-button>
                </div>
              </div>
            </template>
          </el-tree>
        </el-scrollbar>
      </div>
      <ScalePanel v-model="dlg.data" ref="scale" @mask-click="dlg.clickMask">
        <MenuHandle
          v-if="dlg.is === 'menu'"
          ref="menuRef"
          :focus="!!dlg.data.mask"
          @edit="dlg.onMenuEdit"
          @delete="dlg.onMenuDelete"
          @add="dlg.onMenuAdd"></MenuHandle>
        <EditTopic
          ref="editTopicRef"
          v-else-if="dlg.is === 'editTopic' && dlg.selectedTopic"
          v-model="dlg.selectedTopic"
          @close="dlg.clickMask"></EditTopic>
      </ScalePanel>
    </template>
    <template #content v-if="currentTopic">
      <ChatContent v-model="currentTopic" />
    </template>
  </SubNavLayout>
</template>
<style lang="scss" scoped>
.chat-provider-header {
  flex-shrink: 0;
  flex-direction: column;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.chat-provider-content {
  flex: 1;
  overflow: hidden;
  .el-tree {
    --el-tree-node-content-height: 3.5rem;
  }
}

.chat-tree-node {
  --chat-tree-icon-size: 2.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  .chat-tree-icon {
    transition: all 0.3s ease-in-out;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--chat-tree-icon-size);
    height: var(--chat-tree-icon-size);
    border-radius: 0.5rem;
    &:hover {
      background-color: rgba(10, 205, 231, 0.2);
    }
  }
  .chat-tree-label {
    font-size: 1.2rem;
    flex: 1;
  }
  .chat-tree-handle {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}
</style>
