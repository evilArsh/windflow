import { Transaction } from "dexie"
import { ModelMeta, ModelType, ProviderMeta } from "@windflow/core/types"

export async function migrateToV4(tx: Transaction) {
  console.log("[migrateToV4]")
  await tx
    .table("model")
    .toCollection()
    .modify((meta: ModelMeta) => {
      meta.type = meta.type.reduce((prev: ModelType[], cur: ModelType) => {
        if ((cur as string) === "ChatReasoner") {
          if (!prev.includes(ModelType.Chat)) {
            prev.push(ModelType.Chat)
          }
        }
        return prev
      }, [] as ModelType[])
    })

  await tx
    .table("providerMeta")
    .toCollection()
    .modify((meta: ProviderMeta) => {
      meta.selectedTypes = meta.selectedTypes.reduce((prev: ModelType[], cur: ModelType) => {
        if ((cur as string) === "ChatReasoner") {
          if (!prev.includes(ModelType.Chat)) {
            prev.push(ModelType.Chat)
          }
        }
        return prev
      }, [] as ModelType[])
    })
}
