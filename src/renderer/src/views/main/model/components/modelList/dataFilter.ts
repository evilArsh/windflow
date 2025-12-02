import { ModelActiveStatus, ModelMeta, ModelType, ProviderMeta } from "@renderer/types"
import useModelStore from "@renderer/store/model"
import { storeToRefs } from "pinia"
import { ShallowRef } from "vue"

// condition --start
const condProviderName = (provider: ProviderMeta, meta: ModelMeta) => {
  return meta.providerName === provider.name
}
const condSelectedTypes = (provider: ProviderMeta, meta: ModelMeta) => {
  return !provider.selectedTypes.length || provider.selectedTypes.some(t => meta.type.includes(t))
}
const condSelectedSubProviders = (provider: ProviderMeta, meta: ModelMeta) => {
  return !provider.selectedSubProviders.length || provider.selectedSubProviders.includes(meta.subProviderName)
}
const condKeyword = (keyword: string, meta: ModelMeta) => {
  return (
    meta.modelName.toLowerCase().includes(keyword.toLowerCase()) ||
    meta.subProviderName.toLowerCase().includes(keyword.toLowerCase()) ||
    meta.providerName.toLowerCase().includes(keyword.toLowerCase())
  )
}
const condActiveStatus = (provider: ProviderMeta, meta: ModelMeta) => {
  return (
    provider.activeStatus === ModelActiveStatus.All ||
    (provider.activeStatus === ModelActiveStatus.Active && meta.active) ||
    (provider.activeStatus === ModelActiveStatus.Inactive && !meta.active)
  )
}
// condition --end
export function useDataFilter(provider: Readonly<ShallowRef<ProviderMeta | undefined>>) {
  const loading = ref(false)
  const list = ref<ModelMeta[]>([])
  const modelTypeKeys = Object.keys(ModelType)
  const modelStore = useModelStore()
  const { models } = storeToRefs(modelStore)
  const keyword = ref("")

  const scopeList = computed(() =>
    models.value.filter(meta => {
      return provider.value && condProviderName(provider.value, meta)
    })
  )
  const rawList = computed(() =>
    scopeList.value.filter(meta => {
      return (
        provider.value &&
        condKeyword(keyword.value, meta) &&
        condSelectedTypes(provider.value, meta) &&
        condSelectedSubProviders(provider.value, meta) &&
        condActiveStatus(provider.value, meta)
      )
    })
  )
  const subProviders = computed(() => {
    return scopeList.value
      .reduce<string[]>((acc, cur) => {
        if (!acc.includes(cur.subProviderName)) {
          acc.push(cur.subProviderName)
        }
        return acc
      }, [])
      .sort((a, b) => a.localeCompare(b))
  })

  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = computed(() => rawList.value.length)
  function onQuery() {
    list.value.length = 0
    currentPage.value = 1
    onList()
  }
  function onReset() {
    currentPage.value = 1
    onQuery()
  }
  function onList() {
    const start = (currentPage.value - 1) * pageSize.value
    const end = Math.min(start + pageSize.value, total.value)
    if (start >= total.value) {
      return
    }
    list.value = rawList.value.slice(start, end)
  }
  watch(rawList, onQuery)
  return {
    keyword,
    loading,
    list,
    modelTypeKeys,
    subProviders,
    currentPage,
    pageSize,
    total,
    onQuery,
    onReset,
    onList,
  }
}
