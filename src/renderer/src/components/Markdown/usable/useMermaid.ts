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
