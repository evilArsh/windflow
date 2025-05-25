import { MCPServerParam } from "@shared/types/mcp"

export const mcpStdioDefault = (): MCPServerParam[] => {
  return [
    {
      type: "stdio",
      id: "server-everything",
      serverName: "server-everything",
      description: "",
      params: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-everything"],
        env: {},
      },
    },
    {
      type: "stdio",
      id: "server-filesystem",
      serverName: "server-filesystem",
      description: "",
      params: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "D:\\"],
        env: {},
      },
    },
  ]
}
