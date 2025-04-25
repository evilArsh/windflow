export interface MCPStdioServer {
  id: string
  command: string
  serverName: string
  disabled?: boolean
  description?: string
  args?: string[]
  env?: Record<string, string | number>
  cwd?: string
}
