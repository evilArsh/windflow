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
  name: string
  inputSchema: {
    [x: string]: unknown
  }
  description?: string
}
