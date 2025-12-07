import { db } from "."
import { DexieTable, DexieTransaction, QueryParams } from "../types"

export function resolveDb(params?: QueryParams): DexieTransaction | DexieTable {
  return params?.transaction ?? db
}
