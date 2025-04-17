import { BridgeResponse, BridgeStatusResponse } from "./bridge"
import { CallToolResult, MCPStdioServersParams, MCPToolDetail } from "./mcp"

export const IpcChannel = {
  McpRegisterClient: "mcp.registerClient",
  McpToggleClient: "mcp.toggleClient",
  McpListTools: "mcp.listTools",
  McpCallTool: "mcp.callTool",
}
export interface MCPService {
  registerClient: (name: string, serverParams: MCPStdioServersParams) => Promise<BridgeStatusResponse>
  toggleClient: (name: string, disabled: boolean) => Promise<BridgeStatusResponse>
  listTools: (clientName?: string) => Promise<BridgeResponse<MCPToolDetail[]>>
  // listPrompts: (label?: string) => Promise<BridgeResponse<string[]>>
  // listResources: (label?: string) => Promise<BridgeResponse<string[]>>
  // listResourceTemplates: (label?: string) => Promise<BridgeResponse<string[]>>
  callTool: (toolname: string, args?: Record<string, unknown>) => Promise<BridgeResponse<CallToolResult>>
}
