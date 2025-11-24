import { useInjectedSetup } from "../../../../../.test/mount"
import { describe, expect, it } from "vitest"
import { reactive } from "vue"
import {
  ChatMessageTree,
  ChatLLMConfig,
  ChatTTIConfig,
  ChatMessageType,
  ChatMessageContextFlag,
} from "../../../types/index"
import { useUtils } from "../utils"
describe("chat-store-utils", () => {
  it("test getIsolatedMessages", () => {
    useInjectedSetup(() => {
      const chatMessage = reactive<Record<string, ChatMessageTree[]>>({})
      const chatLLMConfig = reactive<Record<string, ChatLLMConfig>>({})
      const chatTTIConfig = reactive<Record<string, ChatTTIConfig>>({})

      const genById = (ids: Array<{ id: string; flag: ChatMessageContextFlag }>): ChatMessageTree[] => {
        return ids.map<ChatMessageTree>((data, index) => ({
          id: data.id,
          node: {
            id: data.id,
            index,
            contextFlag: data.flag,
            topicId: "1",
            modelId: "1",
            createAt: 0,
            content: { role: "user", content: "" },
            type: ChatMessageType.TEXT,
            status: 200,
          },
          children: [],
        }))
      }
      const utils = useUtils(chatMessage, chatLLMConfig, chatTTIConfig)
      const targetId = "testid"

      // ---
      let msgs: ChatMessageTree[] = genById([
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: targetId, flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
      ])
      let res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(3)
      // ---

      // ---
      msgs = genById([
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
        { id: targetId, flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
      ])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(2)
      // ---

      // ---
      msgs = genById([
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: targetId, flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
      ])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(2)
      // ---

      // ---
      msgs = genById([
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
        { id: targetId, flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
      ])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(1)
      // ---

      // ---
      msgs = genById([
        { id: targetId, flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
      ])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(1)
      // ---

      // ---
      msgs = genById([
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
        { id: targetId, flag: ChatMessageContextFlag.PART },
      ])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(1)
      // ---

      // ---
      msgs = genById([{ id: targetId, flag: ChatMessageContextFlag.PART }])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(1)
      // ---

      // ---
      msgs = genById([{ id: targetId, flag: ChatMessageContextFlag.BOUNDARY }])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(0)
      // ---

      // ---
      msgs = genById([
        { id: targetId, flag: ChatMessageContextFlag.BOUNDARY },
        { id: targetId, flag: ChatMessageContextFlag.BOUNDARY },
        { id: targetId, flag: ChatMessageContextFlag.BOUNDARY },
        { id: targetId, flag: ChatMessageContextFlag.BOUNDARY },
        { id: targetId, flag: ChatMessageContextFlag.BOUNDARY },
      ])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(0)
      // ---

      // ---
      msgs = genById([
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
      ])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(0)
      // ---

      // ---
      msgs = genById([
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
      ])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(0)
      // ---

      // ---
      msgs = genById([
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: targetId, flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
        { id: "1", flag: ChatMessageContextFlag.PART },
      ])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(5)
      // ---

      // ---
      msgs = genById([
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
        { id: targetId, flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
        { id: "1", flag: ChatMessageContextFlag.PART },
      ])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(3)
      // ---

      // ---
      msgs = genById([
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: targetId, flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.BOUNDARY },
      ])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(7)
      // ---

      // ---
      msgs = genById([
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: targetId, flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
        { id: "1", flag: ChatMessageContextFlag.PART },
      ])
      res = utils.getIsolatedMessages(msgs, targetId)
      expect(res.length).equal(8)
      // ---
    })
  })
})
