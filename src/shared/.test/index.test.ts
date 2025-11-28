import { describe, expect, it } from "vitest"
import { useSchemaValidate } from "../mcp"
import { McpServersSchema, McpServerInnerSchema } from "../../renderer/src/views/main/mcp/index/components/helper"

describe("mcp config schema validation", () => {
  it("mcp schema failed", () => {
    const ajv = useSchemaValidate()
    const s = {
      mcfasfpSservers: {
        fetch: {
          args: ["mcp-server-fetch"],
          command: "uvx",
          env: {},
          url: "",
        },
      },
    }
    const [ok, err] = ajv.validate(McpServersSchema, s)
    console.log(err)
    expect(ok).toBe(false)
  })
  it("mcp schema success", () => {
    const ajv = useSchemaValidate()
    const s = {
      mcpServers: {
        fetch: {
          args: ["mcp-server-fetch"],
          command: "uvx",
          env: {},
          url: "",
        },
      },
    }
    const [ok, err] = ajv.validate(McpServersSchema, s)
    console.log(err)
    expect(ok).toBe(true)
  })
})
