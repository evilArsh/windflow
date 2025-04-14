import { Client } from "@modelcontextprotocol/sdk/client/index.js"

const mcp = new Client({ name: "mcpdemo", version: "v1.0.0" })
mcp.listTools()
