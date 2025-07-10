import type { Primitive } from "type-fest"

export enum SettingKeys {
  ChatSubNav = "chat.subNav", // 聊天子菜单宽度配置
  ChatToggleMenu = "chat.toggleMenu", // 聊天列表显隐
  ChatTogglePanel = "chat.togglePanel", // 聊天右侧显隐
  ChatSendShortcut = "chat.sendShortcut", // 聊天发送快捷键
  ChatCleanContext = "chat.cleanContext", // 清除聊天上下文
  ChatCleanMessage = "chat.cleanMessage", // 清空聊天信息
  ChatDefaultExpandedKeys = "chat.defaultExpandedKeys", // 聊天topic树默认展开的节点列表
  ChatTextToImageConfig = "chat.textToImageConfig", // !全局文本转图片配置
  ChatLLMConfig = "chat.llmConfig", // !全局llm请求配置
  MCPSubNav = "mcp.subNav", // mcp子菜单宽度配置
  ToolEnvironment = "tool.environment", // 全局工具环境配置
  ModelSubNav = "model.subNav", // 模型子菜单宽度配置
  ChatCurrentNodeKey = "chat.currentNodeKey", // 当前聊天节点key
  GlobalThemeDark = "global.themeDark", // 全局主题黑色开关
  ProviderCurrentSettingActive = "provider.currentSettingActive", // 选中的提供商
}
export type SettingsValue = Primitive | Array<Primitive> | { [key: string]: SettingsValue }
export type Settings<T extends SettingsValue> = {
  id: string // unique id
  desc?: string // setting description
  value: T
}
