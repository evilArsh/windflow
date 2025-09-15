import { HttpStatusCode } from "@toolmain/shared"
import { MCPClientStatus } from "./mcp"

export const CoreEventKey = "CoreEventKey"
export interface CoreEvent {
  type: EventKey
  data: unknown
}
export enum EventKey {
  MCPStatus = "MCPStatus",
  RAGStatus = "RAGStatus",
  ServiceLog = "ServiceStatus",
}

export type MCPStatusEvent = {
  id: string
  name?: string
  status: MCPClientStatus
  /**
   * 引用该服务的topic列表
   */
  refs: Array<string>
  msg?: string
  code?: HttpStatusCode
}

export type RAGStatusEvent = {
  // TODO:
  msg?: string
  code?: HttpStatusCode
}

export type ServiceLogEvent = {
  id: string
  service: string
  details?: Record<string, unknown>
  msg?: string
  code?: HttpStatusCode
}

export interface EventMap {
  [EventKey.MCPStatus]: MCPStatusEvent
  [EventKey.RAGStatus]: RAGStatusEvent
  [EventKey.ServiceLog]: ServiceLogEvent
}
