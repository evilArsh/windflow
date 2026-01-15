import { msg } from "@renderer/utils"
import { isChatType } from "@windflow/core/models"
import { ModelMeta, ModelType } from "@windflow/core/types"
import { CheckboxValueType } from "element-plus"

export function useModelHelper() {
  const { t } = useI18n()
  const modelTypes = ref<{ label: string; value: ModelType; disabled?: boolean }[]>(
    Object.values(ModelType).map(type => {
      return {
        label: t(`modelType.${type}`),
        value: type,
        disabled: false,
      }
    })
  )
  function beforeActiveChange(model: ModelMeta) {
    return () => {
      if (model.active) {
        return true
      }
      if (!model.type.length) {
        msg({ code: 400, msg: t("provider.emptyModelType") }, { plain: true })
        return false
      }
      return true
    }
  }
  function onTypeGroupChange(data: CheckboxValueType[], model: ModelMeta) {
    if (!data.length) {
      model.active = false
      modelTypes.value.forEach(v => (v.disabled = false))
      return
    }
    modelTypes.value.forEach(v => {
      if (isChatType(model)) {
        v.disabled = v.value !== ModelType.Chat && v.value !== ModelType.ChatReasoner
      } else {
        v.disabled = !model.type.includes(v.value)
      }
    })
  }
  return {
    modelTypes,

    beforeActiveChange,
    onTypeGroupChange,
  }
}
