import mermaid from "mermaid"

export default () => {
  function init() {
    mermaid.initialize({
      startOnLoad: true,
      securityLevel: "loose",
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
      fontFamily: "Maple Mono CN",
      theme: "default",
    })
  }
  function run() {
    mermaid.run()
  }
  return {
    init,
    run,
  }
}
