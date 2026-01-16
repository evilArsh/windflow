import type { Primitive } from "type-fest"

export enum SettingKeys {
  /**
   * 全局语言
   */
  Language = "settings.language",
  /**
   * 默认路由
   */
  DefaultRoute = "settings.defaultRoute",
  /**
   * 聊天子菜单宽度配置
   */
  ChatSubNav = "chat.subNav",
  /**
   * 聊天列表显隐
   */
  ChatToggleMenu = "chat.toggleMenu",
  /**
   * 聊天右侧显隐
   */
  ChatTogglePanel = "chat.togglePanel",
  /**
   * 聊天发送快捷键
   */
  ChatSendShortcut = "chat.sendShortcut",
  /**
   * 清除聊天上下文
   */
  ChatCleanContext = "chat.cleanContext",
  /**
   * 清空聊天信息
   */
  ChatCleanMessage = "chat.cleanMessage",
  /**
   * 聊天topic树默认展开的节点列表
   */
  ChatDefaultExpandedKeys = "chat.defaultExpandedKeys",
  /**
   * 全局文本转图片配置
   */
  ChatTextToImageConfig = "chat.textToImageConfig",
  /**
   * 全局llm请求配置
   */
  ChatLLMConfig = "chat.llmConfig",
  /**
   * 当前聊天节点key
   */
  ChatCurrentNodeKey = "chat.currentNodeKey",
  /**
   * mcp子菜单宽度配置
   */
  MCPSubNav = "mcp.subNav",
  /**
   * mcp子菜单路由
   */
  MCPSubRoute = "mcp.subRoute",
  /**
   * mcp子菜单折叠开关
   */
  MCPToggleSubNav = "mcp.toggleSubNav",
  /**
   * 全局工具环境配置
   */
  ToolEnvironment = "tool.environment",
  /**
   * 模型子菜单宽度配置
   */
  ModelSubNav = "model.subNav",
  /**
   * 模型子菜单折叠开关
   */
  ModelToggleSubNav = "model.toggleSubNav",
  /**
   * 全局主题黑色开关
   */
  GlobalThemeDark = "global.themeDark",
  /**
   * 选中的提供商
   */
  ProviderCurrentSettingActive = "provider.currentSettingActive",
  /**
   * 提供商搜索条件栏显隐
   */
  ProviderSearchBar = "provider.searchBar",
  /**
   * 知识库子菜单宽度配置
   */
  KnowledgeSubNav = "knowledge.subNav",
  /**
   * 知识库子菜单宽度配置
   */
  KnowledgeSubRoute = "knowledge.subRoute",
  /**
   * 知识库选中的id
   */
  KnowledgeId = "knowledge.id",
  /**
   * 知识库子菜单折叠开关
   */
  KnowledgeToggleSubNav = "knowledge.toggleSubNav",
  /**
   * 知识库->嵌入 选中的id
   */
  EmbeddingId = "embedding.id",
}

export type SettingsValue = Primitive | Array<Primitive> | { [key: string]: SettingsValue }
export type Settings<T extends SettingsValue> = {
  /**
   * unique id
   */
  id: SettingKeys
  /**
   * setting description
   */
  desc?: string
  value: T
}
