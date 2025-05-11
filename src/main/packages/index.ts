import { BaseService } from "@shared/types/service"
import useMcp from "./useMCP"
export function registerService() {
  const mcp: BaseService = useMcp()

  mcp.registerIpc()
}
