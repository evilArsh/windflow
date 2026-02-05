import { HttpStatusCode } from "@toolmain/shared"
import { MCPClientStatus } from "./mcp"
import { RAGLocalFileInfo } from "./rag"

export const CoreEventKey = "CoreEventKey"
export interface CoreEvent {
  type: EventKey
  data: unknown
}

// -- Service
export type ServiceLogEvent = {
  id: string
  service: string
  details?: Record<string, unknown>
  msg?: string
  code?: HttpStatusCode
}
// -- Service

// -- MCP
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
// -- MCP

// -- RAG
export type RAGStatusEvent = {
  // TODO:
  msg?: string
  code?: HttpStatusCode
}

export type RAGFileProcessStatusEvent = RAGLocalFileInfo
// -- RAG

// -- AutoUpdate
export type AutoUpdateAvailable = {
  type: "UpdateAvailable" | "UpdateNotAvailable" | "UpdateDownloaded"
  version: string
  releaseDate: string
  releaseName?: string | null
  releaseNotes?:
    | string
    | Array<{
        version: string
        note: string | null
      }>
    | null
}
export type AutoUpdateDownloadProgress = {
  type: "DownloadProgress"
  total: number
  delta: number
  transferred: number
  percent: number
  bytesPerSecond: number
}
export type AutoUpdateChecking = {
  type: "UpdateChecking"
}
export type AutoUpdateError = {
  type: "UpdateError"
  msg?: string
}
export type AutoUpdateStatusEvent =
  | AutoUpdateAvailable
  | AutoUpdateDownloadProgress
  | AutoUpdateChecking
  | AutoUpdateError
// -- AutoUpdate

export enum EventKey {
  MCPStatus = "MCPStatus",
  RAGStatus = "RAGStatus",
  RAGFileProcessStatus = "RAGFileProcessStatus",
  ServiceLog = "ServiceStatus",
  AutoUpdateStatus = "AutoUpdateStatus",
}
export interface EventMap {
  [EventKey.MCPStatus]: MCPStatusEvent

  [EventKey.RAGStatus]: RAGStatusEvent
  [EventKey.RAGFileProcessStatus]: RAGFileProcessStatusEvent

  [EventKey.ServiceLog]: ServiceLogEvent

  [EventKey.AutoUpdateStatus]: AutoUpdateStatusEvent
}
