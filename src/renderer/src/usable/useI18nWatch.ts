import { CallBackFn } from "@renderer/lib/shared/types"

export default (callback: CallBackFn) => {
  const { locale } = useI18n()
  watch(locale, () => {
    callback()
  })
  callback()
}
