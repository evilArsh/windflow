import MarkdownIt from "markdown-it"
import hljs from "highlight.js"
import "highlight.js/styles/github-dark.css"

// import DOMPurify from "dompurify"
export default (md: MarkdownIt) => {
  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx]
    const content = token.content
    const lang = token.info
    console.log(token.content, idx)

    let finalContent = ""
    if (lang && hljs.getLanguage(lang)) {
      try {
        finalContent = hljs.highlight(content, { language: lang, ignoreIllegals: true }).value
      } catch (_) {
        finalContent = md.utils.escapeHtml(content)
      }
    } else {
      finalContent = md.utils.escapeHtml(content)
    }
    const id = "id-" + uniqueId()
    return `
    <div class="el-card is-hover-shadow code-block" id='${id}'>
      <div class="el-card__header" style="display: flex;justify-content: space-between;align-items: center;">
        <span class="el-text el-text--primary">${lang}</span>
        <elbutton type="primary" @click="onCopy" size="small" round plain circle>
          <i-ic:outline-check v-if="copied"></i-ic:outline-check>
          <i-ic:baseline-content-copy v-else></i-ic:baseline-content-copy>
        </elbutton>
      </div>
      <pre>
        <code class='hljs language-${lang}'>${finalContent}</code>
      </pre>
    </div>`
  }
}

// import MarkdownIt from "markdown-it"
// import hljs from "highlight.js"
// import "highlight.js/styles/github-dark.css"

// // import DOMPurify from "dompurify"
// export default (md: MarkdownIt, callback: (elId: string, code: string, content: string, lang: string) => void) => {
//   md.renderer.rules.fence = (tokens, idx) => {
//     const token = tokens[idx]
//     const content = token.content
//     const lang = token.info

//     let finalContent = ""
//     if (lang && hljs.getLanguage(lang)) {
//       try {
//         finalContent = hljs.highlight(content, { language: lang, ignoreIllegals: true }).value
//       } catch (_) {
//         finalContent = md.utils.escapeHtml(content)
//       }
//     } else {
//       finalContent = md.utils.escapeHtml(content)
//     }
//     const id = "id-" + uniqueId()
//     setTimeout(() => {
//       callback(id, content, finalContent, lang)
//     }, 0)
//     return `<div id='${id}'></div>`
//   }
// }
