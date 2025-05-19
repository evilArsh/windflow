import { HttpStatusCode } from "@shared/code"
import { LLMChatMessage, LLMChatRequestHandler, LLMProvider } from "."
import { MCPServerParam } from "@shared/types/mcp"
export enum SettingKeys {
  ChatSubNav = "chat.subNav", // 聊天子菜单宽度配置
  ChatToggleMenu = "chat.toggleMenu", // 聊天列表显隐
  ChatTogglePanel = "chat.togglePanel", // 聊天右侧显隐
  ChatSendShortcut = "chat.sendShortcut", // 聊天发送快捷键
  ChatCleanContext = "chat.cleanContext", // 清除聊天上下文
  ChatClear = "chat.clear", // 清空聊天信息
  McpSubNav = "mcp.subNav", // mcp子菜单宽度配置
  ModelSubNav = "model.subNav", // 模型子菜单宽度配置
  ChatCurrentNodeKey = "chat.currentNodeKey", // 当前聊天节点key
  GlobalThemeDark = "global.themeDark", // 全局主题黑色开关
  ProviderCurrentSettingActive = "provider.currentSettingActive", // 选中的提供商
}
export type ChatMessageData = {
  /**
   * @description 单个消息ID
   */
  id: string
  /**
   * @description 当前消息使用的模型配置id
   */
  modelId: string
  /**
   * @description 当前消息为上下文分界点
   */
  contextFlag?: boolean
  /**
   * @description 消息时间
   */
  time: string
  /**
   * @description 消息内容,包含用户消息和模型返回的消息
   */
  content: LLMChatMessage
  /**
   * @description 请求是否完成，不管是否成功
   */
  finish?: boolean
  /**
   * @description 消息状态码
   */
  status: HttpStatusCode
  /**
   * @description 消息错误信息
   */
  msg?: string
  /**
   * @description tool_calls调用消息，只作为聊天上下文使用
   */
  toolCallsChain?: Array<LLMChatMessage>
  /**
   * @description 多个模型同时请求
   */
  children?: Array<ChatMessageData>
  parentId?: string
}
export type ChatMessage = {
  /**
   * @description 消息ID
   */
  id: string
  data: Array<ChatMessageData>
}
export type ChatTopic = {
  /**
   * @description 会话ID
   */
  id: string
  /**
   * @description 父会话id
   */
  parentId: string | null
  /**
   * @description 会话名称
   */
  label: string
  /**
   * @description 会话图标
   */
  icon: string
  /**
   * @description 当前会话聊天框输入内容
   */
  content: string
  /**
   * @description 当前会话提示词
   */
  prompt: string
  /**
   * @description 当前会话选择的模型配置id
   */
  modelIds: string[]
  /**
   * @description 会话滚动位置
   */
  // scrollY?: number
  /**
   * @description 会话输入框高度
   */
  inputHeight?: number
  /**
   * @description 正在请求的会话个数
   */
  requestCount: number
  /**
   * @description 会话聊天记录
   */
  chatMessageId?: string
  /**
   * @description 会话创建时间
   */
  createAt: number
  /**
   * @description mcp服务器列表
   */
  mcpServers: Array<MCPServerParam>
}

export type ChatTopicTree = {
  id: string
  node: ChatTopic
  children: ChatTopicTree[]
}

export interface ChatContext {
  modelId: string
  /**
   * @description 当前消息ID
   */
  messageId: string
  /**
   * @description 当前子消息id
   */
  messageDataId: string
  provider?: LLMProvider
  handler?: LLMChatRequestHandler
}
