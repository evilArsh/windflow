import { defineStore } from "pinia"
import IIcOutlineDisabledByDefault from "~icons/ic/outline-disabled-by-default"
import { VNode } from "vue"
/**
 * 当icon需要通过配置渲染时的折衷方法，保持icon字段为string,用于保存
 * 使用时先setIcon
 */
export default defineStore("static-icon", () => {
  const iconMap = new Map<string, VNode>()
  function loadIcon(icon: string) {
    return iconMap.get(icon) ?? IIcOutlineDisabledByDefault
  }
  function setIcon(icon: string, value: VNode) {
    iconMap.set(icon, value)
  }
  return {
    loadIcon,
    setIcon,
  }
})
