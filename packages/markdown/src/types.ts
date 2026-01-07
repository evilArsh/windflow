import { Root } from "hast"
import { Components } from "./vue/types"

export type MDWorkerMessageCore =
  | { type: "Parse"; markdown: string; components?: Components }
  | { type: "ParseResponse"; node: Root }
  | { type: "Dispose" }

export type MDWorkerMessage = MDWorkerMessageCore & { id: string }

export interface MDWorkerExpose {
  emit: (id: string, event: MDWorkerMessageCore) => void
  on: (id: string, callback: (event: MDWorkerMessageCore) => void) => void
  /**
   * terminate worker thread
   */
  terminate: () => void
}
