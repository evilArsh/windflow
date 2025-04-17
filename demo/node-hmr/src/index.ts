import "./modules/proxy/index"
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // console.log("[accept]")
  })
  import.meta.hot.dispose(() => {
    // console.log("[dispose]")
  })
}
