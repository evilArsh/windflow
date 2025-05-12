import { MCPServerParam } from "@shared/types/mcp"

export const mcpStdioDefault = (): MCPServerParam[] => {
  return [
    {
      type: "stdio",
      id: "server-everything",
      serverName: "server-everything",
      params: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-everything"],
      },
    },
    {
      type: "stdio",
      id: "server-filesystem",
      serverName: "server-filesystem",
      params: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "D:\\"],
      },
    },
  ]
}
