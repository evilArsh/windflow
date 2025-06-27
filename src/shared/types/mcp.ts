export const NameSeprator = "___"
/**
 * 配置界面虚拟topicID
 */
export const MCPRootTopicId = "RootTopicId"
export type MCPServerType = "sse" | "streamable" | "stdio"
export enum MCPClientStatus {
  Connecting = "connecting",
  Connected = "connected",
  Disconnected = "disconnected",
}
export interface MCPRequestParams {
  /**
   * A timeout (in milliseconds) for this request. If exceeded, an McpError with code `RequestTimeout` will be raised from request().
   *
   * If not specified, `DEFAULT_REQUEST_TIMEOUT_MSEC` will be used as the timeout.
   */
  timeout?: number
  /**
   * Maximum total time (in milliseconds) to wait for a response.
   * If exceeded, an McpError with code `RequestTimeout` will be raised, regardless of progress notifications.
   * If not specified, there is no maximum total timeout.
   */
  maxTotalTimeout?: number
}
export interface MCPParamsBase {
  id: string
  name: string
  description: string
  /**
   * 使用该服务的topic
   */
  referTopics?: string[]
  /**
   * 当前服务为指定mcp id的副本
   */
  referId?: string
  status?: MCPClientStatus
  tools?: MCPToolDetail[]
  prompts?: MCPPromptItem[]
  resources?: MCPResourceItem[]
  resourceTemplates?: MCPResourceTemplatesItem[]
}
export interface MCPStreamableServerParamCore extends MCPRequestParams {
  type: "sse" | "streamable"
  params: {
    url: string
  }
}
export interface MCPStdioServerParamCore extends MCPRequestParams {
  type: "stdio"
  params: {
    /**
     * The executable to run to start the server.
     */
    command: string
    /**
     * Command line arguments to pass to the executable.
     */
    args: string[]
    /**
     * The environment to use when spawning the process.
     *
     * If not specified, the result of getDefaultEnvironment() will be used.
     */
    env: Record<string, string>
    /**
     * The working directory to use when spawning the process.
     *
     * If not specified, the current working directory will be inherited.
     */
    cwd?: string
  }
}
export type MCPStdioServerParam = MCPStdioServerParamCore & MCPParamsBase
export type MCPStreamableServerParam = MCPStreamableServerParamCore & MCPParamsBase
export type MCPServerParam = MCPStdioServerParam | MCPStreamableServerParam

export function isStdioServerParams(params: MCPServerParam): params is MCPStdioServerParam {
  return params.type === "stdio"
}

export function isSSEServerParams(params: MCPServerParam): params is MCPStreamableServerParam {
  return params.type === "sse"
}

export function isStreamableServerParams(params: MCPServerParam): params is MCPStreamableServerParam {
  return params.type === "streamable"
}

export function isAvailableServerParams(params: MCPServerParam): params is MCPServerParam {
  return isSSEServerParams(params) || isStreamableServerParams(params) || isStdioServerParams(params)
}

export function getPureParam(params: MCPServerParam): MCPStreamableServerParamCore | MCPStdioServerParamCore {
  return {
    type: params.type,
    params: params.params,
  } as MCPStreamableServerParamCore | MCPStdioServerParamCore
}

// --- mcp call result start ---

// -- tool calls start ---
export interface MCPToolDetail {
  /**
   * tool name
   */
  name: string
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
export interface MCPResourceTemplatesItem {
  uriTemplate: string
  name: string
  description?: string
  mimeType?: string
}
export interface MCPListResourceTemplatesParams {
  cursor?: string
  [x: string]: unknown
}
export interface MCPListResourceTemplatesResponse {
  nextCursor?: string
  resourceTemplates: Array<MCPResourceTemplatesItem>
}
// -- resource template end ---

// --- mcp call result end ---
