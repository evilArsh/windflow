import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js"
import { MCPServerParam } from "@shared/types/mcp"

export enum MCPClientStatus {
  Connecting = "connecting",
  Connected = "connected",
  Disconnected = "disconnected",
}
export interface MCPClientContext {
  params: MCPServerParam
  /**
   * 使用该工具的 topic id 集合
   */
  reference: Array<string>
  status: MCPClientStatus
  client?: Client
  transport?: Transport
}
