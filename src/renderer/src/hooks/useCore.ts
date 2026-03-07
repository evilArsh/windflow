import { App, InjectionKey } from "vue"
import { MessageManager } from "@windai/core/message"
import { KnowledgeManager } from "@windai/core/knowledge"
import { MCPManager } from "@windai/core/mcp"
import { SettingsManager } from "@windai/core/settings"
import { ModelManager } from "@windai/core/models"
import { ProviderManager } from "@windai/core/provider"
import { MediaManager } from "@windai/core/media"

export const ChatMessageKey: InjectionKey<MessageManager> = Symbol("chatMessage")
export const KnowledgeKey: InjectionKey<KnowledgeManager> = Symbol("knowledgeBase")
export const MCPKey: InjectionKey<MCPManager> = Symbol("mcp")
export const SettingsKey: InjectionKey<SettingsManager> = Symbol("settings")
export const ModelKey: InjectionKey<ModelManager> = Symbol("model")
export const ProviderKey: InjectionKey<ProviderManager> = Symbol("provider")
export const MediaKey: InjectionKey<MediaManager> = Symbol("media")

export const createChatMessage = () => {
  const msgMgr = markRaw(new MessageManager())
  return {
    install: (app: App<Element>) => {
      app.provide(ChatMessageKey, msgMgr)
    },
  }
}
export const createKnowledge = () => {
  const knowledgeMgr = markRaw(new KnowledgeManager())
  return {
    install: (app: App<Element>) => {
      app.provide(KnowledgeKey, knowledgeMgr)
    },
  }
}
export const createMCP = () => {
  const mcpMgr = markRaw(new MCPManager())
  return {
    install: (app: App<Element>) => {
      app.provide(MCPKey, mcpMgr)
    },
  }
}
export const createSettings = () => {
  const settingsMgr = markRaw(new SettingsManager())
  return {
    install: (app: App<Element>) => {
      app.provide(SettingsKey, settingsMgr)
    },
  }
}
export const createModel = () => {
  const modelMgr = markRaw(new ModelManager())
  return {
    install: (app: App<Element>) => {
      app.provide(ModelKey, modelMgr)
    },
  }
}
export const createProvider = () => {
  const providerMgr = markRaw(new ProviderManager())
  return {
    install: (app: App<Element>) => {
      app.provide(ProviderKey, providerMgr)
    },
  }
}
export const createMedia = () => {
  const mediaMgr = markRaw(new MediaManager())
  return {
    install: (app: App<Element>) => {
      app.provide(MediaKey, mediaMgr)
    },
  }
}
export function useMessage(): MessageManager {
  const instance = inject(ChatMessageKey)
  if (!instance) {
    throw new Error("useMessage() is called outside of setup()")
  }
  return instance
}
export function useKnowledge(): KnowledgeManager {
  const instance = inject(KnowledgeKey)
  if (!instance) {
    throw new Error("useKnowledge() is called outside of setup()")
  }
  return instance
}
export function useMCP(): MCPManager {
  const instance = inject(MCPKey)
  if (!instance) {
    throw new Error("useMCP() is called outside of setup()")
  }
  return instance
}
export function useSettings(): SettingsManager {
  const instance = inject(SettingsKey)
  if (!instance) {
    throw new Error("useSettings() is called outside of setup()")
  }
  return instance
}
export function useModels(): ModelManager {
  const instance = inject(ModelKey)
  if (!instance) {
    throw new Error("useModels() is called outside of setup()")
  }
  return instance
}
export function useProvider(): ProviderManager {
  const instance = inject(ProviderKey)
  if (!instance) {
    throw new Error("useProvider() is called outside of setup()")
  }
  return instance
}
export function useMedia(): MediaManager {
  const instance = inject(MediaKey)
  if (!instance) {
    throw new Error("useMedia() is called outside of setup()")
  }
  return instance
}
