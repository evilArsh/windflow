import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
export type MCPStdioServersParams = StdioServerParameters
export type MCPServerContext = {
  params: MCPStdioServersParams
  client?: Client
}
export type MCPServerHandleCommand = {
  command: "start" | "stop" | "restart" | "delete"
}
// --- mcp call result start ---
// -- tool calls start ---
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
  annotations?: {
    // Optional hints about tool behavior
    title?: string // Human-readable title for the tool
    readOnlyHint?: boolean // If true, the tool does not modify its environment
    destructiveHint?: boolean // If true, the tool may perform destructive updates
    idempotentHint?: boolean // If true, repeated calls with same args have no additional effect
    openWorldHint?: boolean // If true, tool interacts with external entities
  }
  description?: string
}
export interface MCPToolContentBase {
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
export interface MCPCallToolResult {
  content: MCPToolContentBase | Array<MCPToolContentBase>
  isError?: boolean
  toolResult?: unknown
  [x: string]: unknown
}
// -- tool calls end ---
// -- resouce start ---
export interface MCPResourceItem {
  uri: string
  name: string
  description?: string
  mimeType?: string
}
export interface MCPListResourcesRequestParams {
  cursor?: string
  [x: string]: unknown
}
export interface MCPListResourcesResponse {
  resources: Array<MCPResourceItem>
  nextCursor?: string
}
// -- resource end ---
// -- prompt start ---
export type MCPListPromptsRequestParams = MCPListResourcesRequestParams
export interface MCPPromptItem {
  name: string
  description?: string
  arguments?: Array<{
    name: string
    description?: string
    required?: boolean
  }>
}
export interface MCPListPromptsResponse {
  nextCursor?: string
  prompts: Array<MCPPromptItem>
}
// -- prompt end ---
// -- resource template start ---
export interface MCPListResourceTemplatesParams {
  cursor?: string
  [x: string]: unknown
}
export interface MCPListResourceTemplatesResponse {
  nextCursor?: string
  resourceTemplates: Array<{
    uriTemplate: string
    name: string
    description?: string
    mimeType?: string
  }>
}
// -- resource template end ---
// --- mcp call result end ---
