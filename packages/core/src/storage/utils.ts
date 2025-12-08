import { db } from "."
import { DexieTable, DexieTransaction, QueryParams } from "@windflow/core/types"

export function resolveDb(params?: QueryParams): DexieTransaction | DexieTable {
  return params?.transaction ?? db
}
