import { HttpStatusCode } from "@shared/code"
import { Message, Provider, RequestHandler } from "."
export type ChatMessage = {
  /**
   * @description 消息ID
   */
  id: string
  /**
   * @description 当前消息使用的模型配置id
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
   * @description 消息类型，默认为'text'消息
   */
  type?: "text" | "image" | "audio" | "video" | "multi-models"
  /**
   * @description 当前消息为上下文分界点
   */
  contextFlag?: boolean
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
   * @description 多个模型同时请求
   */
  children?: Array<ChatMessage>
  /**
   * @description 多模型同时请求时，标识父ChatMessageData的ID
   */
  parentId?: string
  /**
   * @description 如果当前消息为AI响应，则标识当前消息是对哪个提问的响应
   */
  fromId?: string
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
}

export type ChatLLMConfig = {
  id: string
  topicId: string
  /**
   * @description 模型温度
   */
  temperature: number
  /**
   * @description 是否流式返回
   */
  stream?: boolean
  top_p: number
  frequency_penalty: number
  presence_penalty: number
  max_tokens: number
}

export type ChatTTIConfig = {
  id: string
  topicId: string
  /**
   * @description 生成图片的大小。
   * 1.siliconflow: batch_size === n
   */
  n: number
  /**
   * @description 图片尺寸。
   * 1.siliconflow: image_size ===  size
   */
  size?: string
  /**
   * @description 推理步数。
   * 平台：siliconflow
   */
  num_inference_steps?: number
  /**
   * @description 引导权重。
   * 平台：siliconflow
   */
  guidance_scale?: number
  /**
   * @description 反向提示词。
   * 平台：siliconflow
   */
  negative_prompt?: string
  /**
   * @description 随机种子
   */
  seed?: number
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
  provider?: Provider
  handler?: RequestHandler
}
