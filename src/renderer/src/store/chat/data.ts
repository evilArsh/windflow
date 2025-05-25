import { ChatMessage, ChatTopic, ChatTopicTree, SettingKeys, Settings } from "@renderer/types"
import { db } from "@renderer/usable/useDatabase"
import PQueue from "p-queue"
import { Reactive } from "vue"
import { chatTopicDefault, chatMessageDefault } from "./default"
import useSettingsStore from "@renderer/store/settings"

export const useData = (
  topicList: Reactive<Array<ChatTopicTree>>,
  chatMessage: Reactive<Record<string, ChatMessage>>,
  currentTopic: Ref<ChatTopicTree | undefined>,
  currentMessage: Ref<ChatMessage | undefined>,
  currentNodeKey: Ref<string>
) => {
  const queue = markRaw(new PQueue({ concurrency: 1 }))
  const mqueue = markRaw(new PQueue({ concurrency: 1 }))
  const settingsStore = useSettingsStore()
  function topicToTree(topic: ChatTopic): ChatTopicTree {
    return { id: topic.id, node: topic, children: [] }
  }
  function assembleTopicTree(data: ChatTopic[], cb: (item: ChatTopicTree) => void): ChatTopicTree[] {
    const res: ChatTopicTree[] = []
    const maps: Record<string, ChatTopicTree> = {}
    data.forEach(item => {
      maps[item.id] = topicToTree(item)
      cb(maps[item.id])
    })
    data.forEach(item => {
      if (!item.parentId) {
        res.push(maps[item.id])
      } else {
        if (maps[item.parentId]) {
          maps[item.parentId].children.push(maps[item.id])
        }
      }
    })
    return res
  }
  /**
   * 以队列方式更新数据，在频繁更新数据时保证更新顺序和请求顺序一致
   */
  const updateChatTopic = async (data: ChatTopic) => queue.add(() => db.chatTopic.update(data.id, toRaw(data)))

  async function addChatTopic(data: ChatTopic) {
    return db.chatTopic.add(toRaw(data))
  }
  async function addChatMessage(data: ChatMessage) {
    return db.chatMessage.add(toRaw(data))
  }
  /**
   * 以队列方式更新数据，在频繁更新数据时保证更新顺序和请求顺序一致
   */
  const updateChatMessage = async (data: ChatMessage) => mqueue.add(() => db.chatMessage.update(data.id, toRaw(data)))
  async function findChatMessage(id: string) {
    const res = await db.chatMessage.get(id)
    if (res) {
      res.data.forEach(item => {
        item.finish = true
        item.status = 200
      })
    }
    return res
  }
  /**
   * @description 删除对应的聊天组和聊天消息
   */
  async function delChatTopic(data: ChatTopic[]) {
    return db
      .transaction("rw", db.chatMessage, db.chatTopic, async trans => {
        for (const item of data) {
          trans.chatTopic.delete(item.id)
          if (item.chatMessageId) {
            trans.chatMessage.delete(item.chatMessageId)
          }
        }
      })
      .then(() => {
        return true
      })
      .catch(error => {
        console.log(`[dbDelChatTopic]`, error)
        return false
      })
  }
  const fetch = async () => {
    try {
      topicList.length = 0
      for (const key in chatMessage) {
        delete chatMessage[key]
      }
      const data = await db.chatTopic.orderBy("createAt").toArray()
      const defaultData = chatTopicDefault()
      for (const item of defaultData) {
        if (!data.find(v => v.id === item.id)) {
          data.push(item)
          await db.chatTopic.add(item)
        }
      }
      // --- 恢复状态
      const nodeKeyData = (await db.settings.get(SettingKeys.ChatCurrentNodeKey)) as Settings<string> | undefined
      currentNodeKey.value = nodeKeyData ? nodeKeyData.value : ""
      topicList.push(
        ...assembleTopicTree(data, async item => {
          item.node.requestCount = 0
          if (item.id === currentNodeKey.value) {
            currentTopic.value = item
            let msg: ChatMessage | undefined = undefined
            if (item.node.chatMessageId) {
              msg = await db.chatMessage.get(item.node.chatMessageId)
            }
            if (!msg) {
              msg = chatMessageDefault()
            }
            chatMessage[msg.id] = msg
            currentMessage.value = msg
            item.node.chatMessageId = msg.id
            msg.data.forEach(v => {
              v.finish = true
              v.status = 200
            })
          }
        })
      )
    } catch (error) {
      console.error(`[fetch chat topic] ${(error as Error).message}`)
    }
  }
  settingsStore.api.dataWatcher<string>(SettingKeys.ChatCurrentNodeKey, currentNodeKey, "")
  return {
    fetch,
    topicToTree,
    assembleTopicTree,
    updateChatTopic,
    addChatTopic,
    addChatMessage,
    updateChatMessage,
    findChatMessage,
    delChatTopic,
  }
}
