import { MCPClientStatus } from "./mcp"

export const CoreEventKey = "CoreEventKey"
export interface CoreEvent {
  type: EventKey
  data: unknown
}
export enum EventKey {
  MCPStatusUpdate = "MCPStatusUpdate",
}

export type MCPStatusUpdateEvent = {
  id: string
  status: MCPClientStatus
  /**
   * 引用该服务的topic列表
   */
  refs: Array<string>
}

export interface EventMap {
  [EventKey.MCPStatusUpdate]: MCPStatusUpdateEvent
}
