import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
export interface MCPStdioServersParams extends StdioServerParameters {
  disabled?: boolean
  /**
   * @description 拥有权限的工具列表
   */
  autoApprove?: Array<string>
}
export type MCPServerContext = {
  params: MCPStdioServersParams
  client?: Client
}
export interface MCPToolDetail {
  /**
   * tool name
   */
  name: string
  /**
   * tool from which server
   */
  serverName: string
  inputSchema?: {
    [x: string]: unknown
  }
  description?: string
}

// --- mcp call result start ---
export interface ToolContentBase {
  type: "text" | "image" | "audio" | "resource"
  text?: string
  data?: string
  mimeType?: string
  uri?: string
  blob?: string
  resource?: {
    uri: string
    text?: string
    mimeType?: string
    blob?: string
  }
  [x: string]: unknown
}
export interface CallToolResult {
  content: ToolContentBase | ToolContentBase[]
  isError?: boolean
  toolResult?: unknown
  [x: string]: unknown
}
// --- mcp call result end ---
