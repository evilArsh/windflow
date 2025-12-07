import { ModelMeta, ModelType } from "../../types"
import { IconifyJSON } from "@iconify/types"
// TODO: refactor
import { getIconHTML } from "@renderer/components/SvgPicker"

export const modelsDefault = (providerSvgIcon: IconifyJSON): ModelMeta[] => {
  return [
    {
      id: `deepseek_deepseek-chat`,
      modelName: "deepseek-chat",
      type: [ModelType.Chat],
      providerName: "deepseek",
      subProviderName: "deepseek",
      icon: getIconHTML(providerSvgIcon, "deepseek"),
      active: false,
    },
    {
      id: `deepseek_deepseek-reasoner`,
      modelName: "deepseek-reasoner",
      type: [ModelType.ChatReasoner],
      providerName: "deepseek",
      subProviderName: "deepseek",
      icon: getIconHTML(providerSvgIcon, "deepseek"),
      active: false,
    },
    {
      id: `volcengine_deepseek-r1`,
      modelName: "deepseek-r1-250120",
      type: [ModelType.ChatReasoner],
      providerName: "volcengine",
      subProviderName: "deepseek",
      icon: getIconHTML(providerSvgIcon, "deepseek"),
      active: false,
    },
    {
      id: `volcengine_deepseek-v3`,
      modelName: "deepseek-v3-250324",
      type: [ModelType.Chat],
      providerName: "volcengine",
      subProviderName: "deepseek",
      icon: getIconHTML(providerSvgIcon, "deepseek"),
      active: false,
    },
    {
      id: `volcengine_deepseek-r1-distill-qwen-7b`,
      modelName: "deepseek-r1-distill-qwen-7b-250120",
      type: [ModelType.ChatReasoner],
      providerName: "volcengine",
      subProviderName: "deepseek",
      icon: getIconHTML(providerSvgIcon, "deepseek"),
      active: false,
    },
    {
      id: `volcengine_deepseek-r1-distill-qwen-32b`,
      modelName: "deepseek-r1-distill-qwen-32b-250120",
      type: [ModelType.ChatReasoner],
      providerName: "volcengine",
      subProviderName: "deepseek",
      icon: getIconHTML(providerSvgIcon, "deepseek"),
      active: false,
    },
  ]
}
