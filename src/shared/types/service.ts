import { BridgeResponse, BridgeStatusResponse } from "./bridge"
import { MCPStdioServersParams, MCPToolDetail } from "./mcp"

export enum IpcChannel {
  mcp_registerClient = "mcp:registerClient",
  mcp_toggleServer = "mcp:toggleServer",
  mcp_listTools = "mcp:listTools",
  mcp_listAllTools = "mcp:listAllTools",
}

export interface MCPService {
  registerClient: (label: string, serverParams: MCPStdioServersParams) => Promise<BridgeStatusResponse>
  toggleServer: (label: string, disabled: boolean) => Promise<BridgeStatusResponse>
  listTools: (label: string) => Promise<BridgeResponse<MCPToolDetail[]>>
  listAllTools: () => Promise<BridgeResponse<MCPToolDetail[]>>
}
