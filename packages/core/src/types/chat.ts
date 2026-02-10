import { HttpStatusCode } from "@toolmain/shared"
import { LLMConfig, Message, ModelMeta, Provider, ProviderMeta, RequestHandler, TTIConfig } from "@windflow/core/types"
export enum ChatMessageType {
  /**
   * @description 文本消息
   */
  TEXT = "text",
  /**
   * @description 图片消息
   */
  IMAGE = "image",
  /**
   * @description 音频消息
   */
  AUDIO = "audio",
  /**
   * @description 视频消息
   */
  VIDEO = "video",
}
export enum ChatMessageContextFlag {
  /**
   * 消息边界线，当前消息以及之前的消息不会放入上下文中
   */
  BOUNDARY = "boundary",
  /**
   * 消息上下文的一部分
   */
  PART = "part",
}
export type ChatMessage = {
  /**
   * @description 消息ID
   */
  id: string
  /**
   * @description 当前消息使用的模型配置id,非模型name
   */
  modelId: string
  /**
   * @description 消息序号
   */
  index: number
  /**
   * @description 消息所属的会话id
   */
  topicId: string
  /**
   * @description 消息创建时间
   */
  createAt: number
  /**
   * @description 消息内容,包含用户消息和模型返回的消息
   */
  content: Message
  /**
   * @description 消息类型,同时请求多个模型时，为数组
   */
  type: ChatMessageType | ChatMessageType[]
  /**
   * @description 消息上下文标志
   */
  contextFlag?: ChatMessageContextFlag
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
   * @description 标识为多模型同时请求的消息
   */
  concurrency?: boolean
  /**
   * @description 标识当前消息是对 `fromId` 消息的回应
   */
  fromId?: string
  // /**
  //  * @description 多模型同时请求时，标识父ChatMessage的ID
  //  */
  // parentId?: string
  /**
   * @description 本次请求中模型产生的token数
   */
  completionTokens?: number
  /**
   * @description 本次请求中用户输入的token数
   */
  promptTokens?: number
}
export type ChatTopic = {
  /**
   * @description 会话ID
   */
  id: string
  /**
   * @description 会话创建时间
   */
  createAt: number
  /**
   * @description 会话序号
   */
  index: number
  /**
   * @description 父会话id
   */
  parentId?: string | null
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
   * 当前会话选择的知识库
   */
  knowledgeId: string[]
  /**
   * @description 会话输入框高度
   */
  inputHeight?: number
  /**
   * @description 正在请求的会话个数
   */
  requestCount: number
  /**
   * @description 最大上下文聊天个数
   */
  maxContextLength?: number
  /**
   * @description 虚拟节点不会展示在聊天列表中
   */
  isVirtual?: boolean
}

export type ChatLLMConfig = LLMConfig & {
  id: string
  topicId: string
}

export type ChatTTIConfig = TTIConfig & {
  id: string
  topicId: string
}

/**
 * ChatTopic in topic
 */
export type ChatTopicTree = {
  id: string
  node: ChatTopic
  children: ChatTopicTree[]
}
/**
 * ChatMessage in topic
 */
export type ChatMessageTree = {
  id: string
  node: ChatMessage
  children: Array<ChatMessageTree>
  parentId?: string
}

export type ChatContext = {
  id: string
  topicId: string
  messageId: string
  modelMeta?: ModelMeta
  providerMeta?: ProviderMeta
  provider?: Provider
  handler?: RequestHandler
}
export interface ChatContextManager {
  /**
   * create a new context and return context id
   */
  create(topicId: string, messageId: string): string
  findByTopic(topicId: string, messageId: string): ChatContext | undefined
  /**
   * find all contexts under `topicId`
   */
  findAllByTopic(topicId: string): ChatContext[] | undefined
  get(contextId: string): ChatContext | undefined
  has(contextId: string): boolean
  /**
   * remove context, try to terminate
   */
  remove(contextId: string): boolean
  setProvider(contextId: string, provider: Provider): boolean
  setHandler(contextId: string, handler: RequestHandler): boolean
  setModelMeta(contextId: string, modelMeta: ModelMeta): boolean
  setProviderMeta(contextId: string, providerMeta: ProviderMeta): boolean
}
export interface ChatEventResponse {
  /**
   * if a message is `Role.User` type, it has no context
   */
  contextId?: string
  /**
   * emit when a message's content changed
   */
  message?: ChatMessage
  /**
   * emit when a topic meta info changed
   */
  topic?: ChatTopic
}
export type ChatEventHandler = (event: ChatEventResponse) => void
