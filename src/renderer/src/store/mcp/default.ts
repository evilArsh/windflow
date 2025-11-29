import { MCPServerParam } from "@shared/types/mcp"

export const mcpStdioDefault = (): MCPServerParam[] => {
  return [
    {
      type: "stdio",
      id: "bingcn",
      name: "bingcn",
      label: "Bing CN Search",
      params: {
        url: "",
        args: ["bing-cn-mcp"],
        command: "npx",
        env: {},
      },
      description: "search content from bing",
    },
    {
      type: "stdio",
      id: "fetch",
      label: "Fetch",
      name: "fetch",
      params: {
        url: "",
        args: ["mcp-server-fetch"],
        command: "uvx",
        env: {},
      },
      description: "fetch content from giving url",
    },
    {
      type: "stdio",
      id: "tavily-mcp",
      name: "tavily-mcp",
      label: "Tavily Search",
      params: {
        url: "",
        args: ["-y", "tavily-mcp@0.1.4"],
        command: "npx",
        env: {
          TAVILY_API_KEY: "your-api-key-here",
        },
      },
      description: "network searching using tavily",
    },
    {
      type: "stdio",
      id: "12306-mcp",
      name: "12306-mcp",
      label: "12306-车票查询工具",
      params: {
        url: "",
        args: ["-y", "12306-mcp"],
        command: "npx",
        env: {},
      },
      description: "12306车票查询工具",
    },
    {
      type: "stdio",
      id: "server-everything",
      label: "Server Everything",
      name: "server-everything",
      description: "",
      params: {
        url: "",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-everything"],
        env: {},
      },
    },
  ]
}
