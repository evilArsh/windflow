export interface MCPStdioServer {
  command: string
  serverName: string
  disabled?: boolean
  description?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string
}
