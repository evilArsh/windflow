import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js"
import { MCPServerParam } from "@shared/types/mcp"

export interface MCPClientContext {
  params: MCPServerParam
  client?: Client
  transport?: Transport
}
