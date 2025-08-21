export default (callback: (locale: string) => void) => {
  const { locale } = useI18n()
  watch(locale, () => {
    callback(locale.value)
  })
  callback(locale.value)
}
