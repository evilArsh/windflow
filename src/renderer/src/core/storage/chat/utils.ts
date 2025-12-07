import { ChatMessage, ChatMessageTree, ChatTopic, ChatTopicTree } from "../../types"
export const assembleMessageTree = (data: ChatMessage[], cb: (item: ChatMessageTree) => void): ChatMessageTree[] => {
  const res: ChatMessageTree[] = []
  const maps: Record<string, ChatMessageTree> = {}
  data.forEach(item => {
    maps[item.id] = { id: item.id, node: item, children: [] }
    cb(maps[item.id])
  })
  data.forEach(item => {
    if (!item.parentId) {
      res.push(maps[item.id])
    } else {
      if (maps[item.parentId]) {
        maps[item.parentId].children.push(maps[item.id])
        maps[item.parentId].children.sort((a, b) => a.node.index - b.node.index)
      }
    }
  })
  return res
}

export const assembleTopicTree = (data: ChatTopic[], cb: (item: ChatTopicTree) => void): ChatTopicTree[] => {
  const res: ChatTopicTree[] = []
  const maps: Record<string, ChatTopicTree> = {}
  data.forEach(item => {
    maps[item.id] = { id: item.id, node: item, children: [] }
    cb(maps[item.id])
  })
  data.forEach(item => {
    if (!item.parentId) {
      res.push(maps[item.id])
    } else {
      if (maps[item.parentId]) {
        maps[item.parentId].children.push(maps[item.id])
        maps[item.parentId].children.sort((a, b) => a.node.index - b.node.index)
      }
    }
  })
  return res
}
